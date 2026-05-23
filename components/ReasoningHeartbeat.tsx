"use client";

import { useEffect, useState } from "react";
import { useAgentStore, REASONING_SWEEP_INTERVAL_MS } from "@/lib/store";

/** Re-render every `intervalMs` so the countdown ticks live. */
function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Live indicator for the reasoning agent's background monitoring. The actual
 * sweeps are driven by an interval in DemoCockpit (always mounted); this just
 * reads the resulting store state and renders a pulsing, ticking view so the
 * console reads as "actively working" rather than static.
 */
export default function ReasoningHeartbeat({ variant = "full" }: { variant?: "full" | "compact" }) {
  const hb = useAgentStore((s) => s.reasoningHeartbeat);
  const now = useNow(1000);

  const nextAt = hb.lastSweepAt ? hb.lastSweepAt + REASONING_SWEEP_INTERVAL_MS : null;
  const remainingMs = nextAt ? nextAt - now : REASONING_SWEEP_INTERVAL_MS;
  const remaining = hb.budgetTotal - hb.budgetUsed;
  const usedPct = hb.budgetTotal ? (hb.budgetUsed / hb.budgetTotal) * 100 : 0;

  if (variant === "compact") {
    return (
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-[#8C8C85] tracking-wider uppercase font-mono">
          Reasoning Agent
        </span>
        <div className="p-3 border border-[#2C2C2A] bg-[#0A0A0A] font-mono text-[10px] rounded-none space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-300">
              <PulseDot />
              MONITORING
            </span>
            <span className="text-[#8C8C85]">next {fmtCountdown(remainingMs)}</span>
          </div>
          <div className="w-full bg-[#171716] h-1 border border-[#2C2C2A]">
            <div className="bg-amber-500/70 h-full transition-[width] duration-700" style={{ width: `${usedPct}%` }} />
          </div>
          <div className="flex justify-between text-[#8C8C85]/80">
            <span>{hb.sweeps} sweeps</span>
            <span>{remaining.toLocaleString()} tok left</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-amber-900/40 bg-amber-950/10 rounded p-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <PulseDot />
          <span className="text-xs font-medium text-amber-200">Background monitoring — active</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
          next sweep in {fmtCountdown(remainingMs)}
        </span>
      </div>

      <p className="text-[11px] text-neutral-400 leading-relaxed">
        Even with nothing on camera, the reasoning agent runs a lightweight sweep every minute —
        re-checking recent detections for flicker, drift, and missed events. Each sweep draws down
        its compute-token budget.
      </p>

      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-mono text-neutral-500">
          <span>compute budget</span>
          <span>
            <span className="text-amber-300">{hb.budgetUsed.toLocaleString()}</span> /{" "}
            {hb.budgetTotal.toLocaleString()} tok used
          </span>
        </div>
        <div className="w-full bg-neutral-900 h-1.5 border border-neutral-800 rounded">
          <div
            className="bg-amber-500/70 h-full rounded-l transition-[width] duration-700"
            style={{ width: `${usedPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-neutral-600">
          <span>{hb.sweeps} sweeps run</span>
          <span>{remaining.toLocaleString()} tok remaining</span>
        </div>
      </div>

      {hb.recent.length > 0 && (
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-mono">Recent sweeps</div>
          <ul className="space-y-0.5 font-mono text-[10px]">
            {hb.recent
              .slice()
              .reverse()
              .slice(0, 5)
              .map((sw) => (
                <li key={sw.at} className="flex items-start gap-2 text-neutral-400">
                  <span className="text-neutral-600 shrink-0">
                    {new Date(sw.at).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <span className="flex-1">{sw.message}</span>
                  <span className="text-amber-400/70 shrink-0">−{sw.tokens}</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative flex h-1.5 w-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
    </span>
  );
}
