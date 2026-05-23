"use client";

import { useEffect, useState } from "react";
import type { SecurityAlert } from "@/lib/security/alerts";

const REFRESH_MS = 2000;

export interface CrimeConfig {
  enabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: number;
  quietHoursEnd: number;
  dwellMs: number;
  cooldownMs: number;
  oncePerSession: boolean;
  sessionClearMs: number;
  requireMovement: boolean;
  movementThresholdPx: number;
}

export interface AnimalConfig {
  enabled: boolean;
  animalLabels: string[];
  cooldownMs: number;
  oncePerSession: boolean;
}

export const ANIMAL_OPTIONS = ["dog", "bear", "cat", "bird"] as const;

interface Props {
  config: CrimeConfig;
  onChange: (next: CrimeConfig) => void;
  animalConfig: AnimalConfig;
  onAnimalChange: (next: AnimalConfig) => void;
}

const EVENT_STYLES: Record<string, { label: string; cls: string }> = {
  person_loitering: { label: "Loitering", cls: "border-amber-700 bg-amber-950/40 text-amber-300" },
  multiple_loitering: { label: "Multiple loitering", cls: "border-orange-700 bg-orange-950/40 text-orange-300" },
  after_hours_activity: { label: "After hours", cls: "border-sky-700 bg-sky-950/40 text-sky-300" },
  weapon_detected: { label: "Weapon", cls: "border-red-700 bg-red-950/40 text-red-300" },
  animal_detected: { label: "Animal", cls: "border-purple-700 bg-purple-950/40 text-purple-300" },
};

export default function SecurityAlertsPanel({ config, onChange, animalConfig, onAnimalChange }: Props) {
  const toggleAnimal = (label: string) => {
    const has = animalConfig.animalLabels.includes(label);
    const next = has
      ? animalConfig.animalLabels.filter((l) => l !== label)
      : [...animalConfig.animalLabels, label];
    onAnimalChange({ ...animalConfig, animalLabels: next });
  };

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
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
            className="accent-emerald-500"
          />
          <span className="font-medium">Crime monitor enabled</span>
        </label>

        <fieldset className="col-span-2 border border-neutral-800 rounded p-2 space-y-1.5 disabled:opacity-50" disabled={!config.enabled}>
          <legend className="px-1 text-[10px] uppercase tracking-wide text-neutral-500">Detection</legend>
          <label className="flex flex-col gap-0.5">
            <span className="text-neutral-400">Loitering threshold: {(config.dwellMs / 1000).toFixed(1)}s</span>
            <input
              type="range" min={1000} max={15000} step={500}
              value={config.dwellMs}
              onChange={(e) => onChange({ ...config, dwellMs: Number(e.target.value) })}
            />
          </label>
        </fieldset>

        <fieldset className="col-span-2 border border-neutral-800 rounded p-2 space-y-1.5 disabled:opacity-50" disabled={!config.enabled}>
          <legend className="px-1 text-[10px] uppercase tracking-wide text-neutral-500">Repeat-fire control</legend>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={config.oncePerSession}
              onChange={(e) => onChange({ ...config, oncePerSession: e.target.checked })}
              className="accent-emerald-500"
            />
            <span>Fire once per session</span>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-neutral-400">Cooldown: {(config.cooldownMs / 1000).toFixed(0)}s</span>
            <input
              type="range" min={5000} max={300000} step={5000}
              value={config.cooldownMs}
              onChange={(e) => onChange({ ...config, cooldownMs: Number(e.target.value) })}
              disabled={config.oncePerSession}
            />
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-neutral-400">Session ends after absent: {(config.sessionClearMs / 1000).toFixed(0)}s</span>
            <input
              type="range" min={2000} max={60000} step={1000}
              value={config.sessionClearMs}
              onChange={(e) => onChange({ ...config, sessionClearMs: Number(e.target.value) })}
              disabled={!config.oncePerSession}
            />
          </label>
        </fieldset>

        <fieldset className="col-span-2 border border-neutral-800 rounded p-2 space-y-1.5 disabled:opacity-50" disabled={!config.enabled}>
          <legend className="px-1 text-[10px] uppercase tracking-wide text-neutral-500">Movement gate</legend>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={config.requireMovement}
              onChange={(e) => onChange({ ...config, requireMovement: e.target.checked })}
              className="accent-emerald-500"
            />
            <span>Require movement to fire loitering</span>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-neutral-400">Movement threshold: {config.movementThresholdPx}px</span>
            <input
              type="range" min={10} max={300} step={5}
              value={config.movementThresholdPx}
              onChange={(e) => onChange({ ...config, movementThresholdPx: Number(e.target.value) })}
              disabled={!config.requireMovement}
            />
          </label>
        </fieldset>

        <fieldset className="col-span-2 border border-neutral-800 rounded p-2 space-y-1.5 disabled:opacity-50" disabled={!config.enabled}>
          <legend className="px-1 text-[10px] uppercase tracking-wide text-neutral-500">Quiet hours</legend>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={config.quietHoursEnabled}
              onChange={(e) => onChange({ ...config, quietHoursEnabled: e.target.checked })}
              className="accent-emerald-500"
            />
            <span>Enable after-hours alerts</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-0.5">
              <span className="text-neutral-400">Start: {hourLabel(config.quietHoursStart)}</span>
              <input
                type="range" min={0} max={23}
                value={config.quietHoursStart}
                onChange={(e) => onChange({ ...config, quietHoursStart: Number(e.target.value) })}
                disabled={!config.quietHoursEnabled}
              />
            </label>
            <label className="flex flex-col gap-0.5">
              <span className="text-neutral-400">End: {hourLabel(config.quietHoursEnd)}</span>
              <input
                type="range" min={0} max={23}
                value={config.quietHoursEnd}
                onChange={(e) => onChange({ ...config, quietHoursEnd: Number(e.target.value) })}
                disabled={!config.quietHoursEnabled}
              />
            </label>
          </div>
          <div className="text-[10px] text-neutral-500">
            {currentlyQuiet(config) ? "Currently in quiet hours." : "Not currently quiet hours."}
          </div>
        </fieldset>

        <fieldset className="col-span-2 border border-neutral-800 rounded p-2 space-y-1.5">
          <legend className="px-1 text-[10px] uppercase tracking-wide text-neutral-500">Animals</legend>
          <label className="flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={animalConfig.enabled}
              onChange={(e) => onAnimalChange({ ...animalConfig, enabled: e.target.checked })}
              className="accent-emerald-500"
            />
            <span>Animal monitor enabled</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {ANIMAL_OPTIONS.map((label) => {
              const on = animalConfig.animalLabels.includes(label);
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleAnimal(label)}
                  disabled={!animalConfig.enabled}
                  className={`px-2 py-1 rounded border text-[11px] ${
                    on
                      ? "border-purple-500 text-purple-300 bg-purple-950/40"
                      : "border-neutral-700 text-neutral-400"
                  } disabled:opacity-50`}
                >
                  {label === "bear" ? "🐻 " : label === "dog" ? "🐕 " : label === "cat" ? "🐈 " : "🐦 "}
                  {label}
                </button>
              );
            })}
          </div>
          <label className="flex items-center gap-1.5 mt-1">
            <input
              type="checkbox"
              checked={animalConfig.oncePerSession}
              onChange={(e) => onAnimalChange({ ...animalConfig, oncePerSession: e.target.checked })}
              disabled={!animalConfig.enabled}
              className="accent-emerald-500"
            />
            <span>Fire once per session per animal</span>
          </label>
          <label className="flex flex-col gap-0.5">
            <span className="text-neutral-400">Animal cooldown: {(animalConfig.cooldownMs / 1000).toFixed(0)}s</span>
            <input
              type="range" min={10000} max={300000} step={10000}
              value={animalConfig.cooldownMs}
              onChange={(e) => onAnimalChange({ ...animalConfig, cooldownMs: Number(e.target.value) })}
              disabled={!animalConfig.enabled || animalConfig.oncePerSession}
            />
          </label>
        </fieldset>
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
