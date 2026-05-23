"use client";

import { useEffect, useState } from "react";
import type { SecurityAlert } from "@/lib/security/alerts";

const REFRESH_MS = 2000;

export interface CrimeConfig {
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  dwellMs: number;
}

interface Props {
  config: CrimeConfig;
  onChange: (next: CrimeConfig) => void;
}

const EVENT_STYLES: Record<string, { label: string; cls: string }> = {
  person_loitering: { label: "Loitering", cls: "border-amber-700 bg-amber-950/40 text-amber-300" },
  multiple_loitering: { label: "Multiple loitering", cls: "border-orange-700 bg-orange-950/40 text-orange-300" },
  after_hours_activity: { label: "After hours", cls: "border-sky-700 bg-sky-950/40 text-sky-300" },
  weapon_detected: { label: "Weapon", cls: "border-red-700 bg-red-950/40 text-red-300" },
};

export default function SecurityAlertsPanel({ config, onChange }: Props) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/security/alert");
        const data = await res.json();
        if (!cancelled) setAlerts(data.alerts ?? []);
      } catch {
        // best-effort
      }
    };
    void tick();
    const id = setInterval(tick, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const clearAlerts = async () => {
    setBusy(true);
    try {
      await fetch("/api/security/alert", { method: "DELETE" });
      setAlerts([]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="border border-neutral-800 rounded bg-neutral-950 p-3">
      <header className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-sm font-medium text-neutral-200">Security alerts</h2>
        <span className="text-[10px] uppercase tracking-wide text-neutral-500">
          {alerts.length} alert{alerts.length === 1 ? "" : "s"}
        </span>
      </header>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs mb-2 p-2 rounded border border-neutral-800 bg-neutral-900/40">
        <label className="flex items-center gap-1.5 col-span-2">
          <input
            type="checkbox"
            checked={config.quietHoursEnabled}
            onChange={(e) => onChange({ ...config, quietHoursEnabled: e.target.checked })}
            className="accent-emerald-500"
          />
          <span>Quiet hours enabled</span>
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-neutral-400">Start: {hourLabel(config.quietHoursStart)}</span>
          <input
            type="range"
            min={0}
            max={23}
            value={config.quietHoursStart}
            onChange={(e) => onChange({ ...config, quietHoursStart: Number(e.target.value) })}
            disabled={!config.quietHoursEnabled}
          />
        </label>
        <label className="flex flex-col gap-0.5">
          <span className="text-neutral-400">End: {hourLabel(config.quietHoursEnd)}</span>
          <input
            type="range"
            min={0}
            max={23}
            value={config.quietHoursEnd}
            onChange={(e) => onChange({ ...config, quietHoursEnd: Number(e.target.value) })}
            disabled={!config.quietHoursEnabled}
          />
        </label>
        <label className="flex flex-col gap-0.5 col-span-2">
          <span className="text-neutral-400">Loitering threshold: {(config.dwellMs / 1000).toFixed(1)}s</span>
          <input
            type="range"
            min={1000}
            max={15000}
            step={500}
            value={config.dwellMs}
            onChange={(e) => onChange({ ...config, dwellMs: Number(e.target.value) })}
          />
        </label>
        <div className="col-span-2 text-[10px] text-neutral-500">
          {currentlyQuiet(config) ? "Currently in quiet hours." : "Not currently quiet hours."}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <button
          className="text-xs px-2 py-1 border border-neutral-700 rounded hover:bg-neutral-900 disabled:opacity-50"
          onClick={clearAlerts}
          disabled={busy || alerts.length === 0}
        >
          Clear
        </button>
      </div>

      {alerts.length === 0 ? (
        <p className="text-xs text-neutral-500">No security alerts yet.</p>
      ) : (
        <ul className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {alerts.map((a) => {
            const style = EVENT_STYLES[a.event_type] ?? {
              label: a.event_type,
              cls: "border-neutral-800 bg-neutral-900/40 text-neutral-300",
            };
            return (
              <li key={a.id} className={`text-xs px-2 py-1.5 rounded border ${style.cls}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium">{style.label}</span>
                  <span className="text-[10px] text-neutral-400">
                    {new Date(a.ts).toLocaleTimeString()} · conf {a.confidence.toFixed(2)}
                  </span>
                </div>
                {a.meta && Object.keys(a.meta).length > 0 && (
                  <pre className="text-[10px] text-neutral-400/80 mt-0.5 whitespace-pre-wrap break-all">
                    {JSON.stringify(a.meta, null, 0)}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function hourLabel(h: number): string {
  const hh = String(h).padStart(2, "0");
  return `${hh}:00`;
}

function currentlyQuiet(c: CrimeConfig): boolean {
  if (!c.quietHoursEnabled) return false;
  const hour = new Date().getHours();
  if (c.quietHoursStart === c.quietHoursEnd) return false;
  if (c.quietHoursStart < c.quietHoursEnd) return hour >= c.quietHoursStart && hour < c.quietHoursEnd;
  return hour >= c.quietHoursStart || hour < c.quietHoursEnd;
}
