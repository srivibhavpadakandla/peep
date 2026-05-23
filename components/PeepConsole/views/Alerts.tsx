"use client";

import { useState } from "react";
import { icons } from "lucide-react";
import {
  EVENT_META,
  SEVERITY,
  fmtDay,
  fmtTime,
  type UiAgentEvent,
} from "../data";
import {
  Btn,
  Divider,
  Mono,
  Pill,
  SeverityChip,
  Slider,
  Toggle,
} from "../primitives";

const ALERT_EVENT_TYPES = [
  "person_loitering",
  "multiple_loitering",
  "weapon_detected",
  "after_hours_activity",
  "animal_detected",
] as const;

function formatDuration(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m} min ${r}s` : `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function ConfigSidebar({ open, onToggle }: { open: boolean; onToggle: (v: boolean) => void }) {
  const [enabled, setEnabled] = useState(true);
  const [dwell, setDwell] = useState(12);
  const [fireOnce, setFireOnce] = useState(true);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("06:00");
  const [movementGate, setMovementGate] = useState(true);
  const [animals, setAnimals] = useState({ dog: true, bear: true, cat: false, bird: false });

  return (
    <div className={"shrink-0 transition-all duration-200 " + (open ? "w-[320px]" : "w-[44px]")}>
      <div className="h-full bg-ink-900 hairline-l flex flex-col">
        {open ? (
          <>
            <div className="px-5 py-4 hairline-b flex items-center justify-between">
              <div className="text-[12px] font-semibold text-ink-100 uppercase tracking-wider">Configuration</div>
              <button onClick={() => onToggle(false)} className="text-ink-400 hover:text-ink-100">
                <icons.PanelRightClose size={14} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scroll-thin">
              <div className="px-5 py-5 hairline-b flex items-center justify-between">
                <div>
                  <div className="text-[13px] text-ink-100 font-medium">Alerts enabled</div>
                  <div className="text-[11.5px] text-ink-400 mt-0.5">Master switch.</div>
                </div>
                <Toggle on={enabled} onChange={setEnabled} />
              </div>

              <div className="px-5 py-5 hairline-b">
                <div className="text-[12.5px] text-ink-100 font-medium">Loitering threshold</div>
                <div className="text-[11.5px] text-ink-400 mt-0.5 mb-3">Trigger after this much dwell time.</div>
                <Slider value={dwell} onChange={setDwell} min={1} max={1800} step={1} format={formatDuration} />
              </div>

              <div className="px-5 py-5 hairline-b flex items-center justify-between">
                <div>
                  <div className="text-[13px] text-ink-100 font-medium">Fire once per session</div>
                  <div className="text-[11.5px] text-ink-400 mt-0.5">Avoid spammy alerts.</div>
                </div>
                <Toggle on={fireOnce} onChange={setFireOnce} />
              </div>

              <div className="px-5 py-5 hairline-b">
                <div className="text-[12.5px] text-ink-100 font-medium">Quiet hours</div>
                <div className="text-[11.5px] text-ink-400 mt-0.5 mb-3">
                  Any movement here escalates to after-hours.
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={quietStart}
                    onChange={(e) => setQuietStart(e.target.value)}
                    className="flex-1 h-8 px-2 rounded-md bg-ink-850 hairline text-[12px] text-ink-100 font-mono"
                  />
                  <span className="text-ink-500 text-[12px]">→</span>
                  <input
                    type="time"
                    value={quietEnd}
                    onChange={(e) => setQuietEnd(e.target.value)}
                    className="flex-1 h-8 px-2 rounded-md bg-ink-850 hairline text-[12px] text-ink-100 font-mono"
                  />
                </div>
              </div>

              <div className="px-5 py-5 hairline-b flex items-center justify-between">
                <div>
                  <div className="text-[13px] text-ink-100 font-medium">Require movement</div>
                  <div className="text-[11.5px] text-ink-400 mt-0.5">Suppress alerts for static silhouettes.</div>
                </div>
                <Toggle on={movementGate} onChange={setMovementGate} />
              </div>

              <div className="px-5 py-5">
                <div className="text-[12.5px] text-ink-100 font-medium">Animal classes</div>
                <div className="text-[11.5px] text-ink-400 mt-0.5 mb-3">Which sightings should escalate.</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["dog", "🐕", "Dog"],
                      ["bear", "🐻", "Bear"],
                      ["cat", "🐈", "Cat"],
                      ["bird", "🐦", "Bird"],
                    ] as const
                  ).map(([k, e, l]) => (
                    <button
                      key={k}
                      onClick={() => setAnimals((a) => ({ ...a, [k]: !a[k] }))}
                      className={
                        "h-7 px-2.5 rounded-md text-[12px] flex items-center gap-1.5 transition-colors hairline " +
                        (animals[k]
                          ? "bg-em-soft text-em"
                          : "bg-ink-850 text-ink-400 hover:bg-ink-800")
                      }
                    >
                      <span>{e}</span>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <button
            onClick={() => onToggle(true)}
            className="w-full h-12 flex items-center justify-center text-ink-400 hover:text-ink-100 hairline-b"
            title="Open config"
          >
            <icons.SlidersHorizontal size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default function AlertsView({ events }: { events: UiAgentEvent[] }) {
  const [configOpen, setConfigOpen] = useState(true);

  const alerts = events.filter((e) => ALERT_EVENT_TYPES.includes(e.type as never));

  return (
    <div className="h-full flex">
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="px-8 pt-6 pb-4 flex items-end justify-between">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-ink-100">Alerts</h1>
            <div className="text-[12.5px] text-ink-400 mt-1">
              {alerts.length} alerts in the last 24 hours. Most recent first.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Btn variant="secondary" size="sm">
              <icons.Download size={12} />
              Export
            </Btn>
            <Btn variant="outline" size="sm">
              <icons.BellOff size={12} />
              Snooze 1h
            </Btn>
          </div>
        </div>

        <div className="px-8 pb-8 space-y-3">
          {alerts.map((a) => {
            const meta = EVENT_META[a.type];
            const sev = meta.severity;
            const isFp = a.reasoning?.verdict === "FALSE_POSITIVE";
            return (
              <div key={a.id} className="relative rounded-xl bg-ink-850 hairline overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: SEVERITY[sev].color }} />
                <div className="pl-6 pr-5 py-4 flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-[20px] shrink-0"
                    style={{
                      background: SEVERITY[sev].bg,
                      boxShadow: `inset 0 0 0 1px ${SEVERITY[sev].ring}`,
                    }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-[14px] font-semibold text-ink-100">{meta.label}</div>
                      <SeverityChip sev={sev} mini />
                      {isFp && <Pill color="#9a9a96">False positive · ignored</Pill>}
                      {a.type === "weapon_detected" && !isFp && (
                        <Pill color="#ef4444">Acknowledge required</Pill>
                      )}
                    </div>
                    <div className="text-[12.5px] text-ink-300 mt-1.5 leading-relaxed">
                      {a.reasoning?.sentence && a.reasoning.sentence !== "—"
                        ? a.reasoning.sentence
                        : a.vision.sentence}
                    </div>
                    {a.executor && (
                      <div className="text-[12px] text-ink-400 mt-2 flex items-center gap-2 flex-wrap">
                        <icons.Zap size={12} className="text-em" />
                        {a.executor.sentence}
                        {a.executor.reference && (
                          <>
                            <Divider vertical />
                            <Mono className="text-ink-200">{a.executor.reference}</Mono>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Mono className="text-[11px] text-ink-300 tabular-nums">
                      {Math.round(a.confidence * 100)}%
                    </Mono>
                    <div className="text-[11px] text-ink-500 mt-1">
                      {fmtDay(a.timestamp)} · {fmtTime(a.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ConfigSidebar open={configOpen} onToggle={setConfigOpen} />
    </div>
  );
}
