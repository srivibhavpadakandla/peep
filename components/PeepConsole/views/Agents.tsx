"use client";

import { useState } from "react";
import { icons } from "lucide-react";
import { AGENTS, EVENT_META, fmtDay, fmtTime, fmtTimeS, type UiAgentEvent, type AgentDescriptor } from "../data";
import {
  Btn,
  Divider,
  Mono,
  SectionLabel,
  SeverityChip,
  Surface,
} from "../primitives";

const AgentCard = ({
  agent,
  runs,
  onOpenRun,
}: {
  agent: AgentDescriptor;
  runs: UiAgentEvent[];
  onOpenRun: (id: string) => void;
}) => {
  const lastRun = runs[0];
  const lastVerdict = lastRun?.[agent.id];
  return (
    <Surface className="p-6 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className="relative w-9 h-9 rounded-lg flex items-center justify-center hairline"
            style={{ background: agent.color + "14" }}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
            <span
              className="absolute w-2 h-2 rounded-full animate-pulse-dot"
              style={{ background: agent.color }}
            />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-ink-100">{agent.name}</div>
            <div className="text-[12px] text-ink-400 mt-0.5">{agent.role}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.12em] text-ink-500">Last verdict</div>
          <div
            className="mt-1 text-[12px] font-mono uppercase tracking-wider"
            style={{ color: agent.color }}
          >
            {lastVerdict?.verdict ||
              (agent.id === "executor" && lastVerdict?.sentence ? "DONE" : "EMITTED")}
          </div>
        </div>
      </div>

      <div className="mt-5 flex-1">
        <SectionLabel>Last 5 outputs</SectionLabel>
        <div className="mt-2 -mx-2">
          {runs.slice(0, 5).map((ev) => {
            const stage = ev[agent.id];
            if (!stage) {
              return (
                <div key={ev.id} className="px-2 py-2.5 rounded-md flex items-start gap-3 opacity-50">
                  <Mono className="text-[10.5px] text-ink-500 w-[44px] shrink-0 tabular-nums mt-0.5">
                    {fmtTime(ev.timestamp)}
                  </Mono>
                  <span className="text-[12px] text-ink-500 italic flex-1">— skipped —</span>
                </div>
              );
            }
            return (
              <button
                key={ev.id}
                onClick={() => onOpenRun(ev.id)}
                className="w-full text-left px-2 py-2.5 rounded-md hover:bg-ink-800 flex items-start gap-3"
              >
                <Mono className="text-[10.5px] text-ink-500 w-[44px] shrink-0 tabular-nums mt-0.5">
                  {fmtTime(ev.timestamp)}
                </Mono>
                <span className="text-[12.5px] text-ink-200 flex-1 leading-snug">{stage.sentence}</span>
                {stage.timing_ms != null && (
                  <Mono className="text-[10.5px] text-ink-500 shrink-0 mt-0.5">{stage.timing_ms}ms</Mono>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-4 hairline-t flex items-start gap-2.5">
        <icons.Sparkle size={13} className="text-ink-500 mt-0.5" />
        <div className="text-[12px] text-ink-300 leading-relaxed">{agent.explainer}</div>
      </div>
    </Surface>
  );
};

const RunDrawer = ({ event, onClose }: { event: UiAgentEvent | null; onClose: () => void }) => {
  if (!event) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative h-full w-[520px] bg-ink-900 hairline-l flex flex-col animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 hairline-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[22px]">{EVENT_META[event.type].emoji}</span>
            <div>
              <div className="text-[14px] font-semibold text-ink-100">{EVENT_META[event.type].label}</div>
              <div className="flex items-center gap-2 mt-1">
                <SeverityChip sev={EVENT_META[event.type].severity} />
                <Divider vertical />
                <Mono className="text-[11px] text-ink-400">
                  {fmtDay(event.timestamp)} · {fmtTimeS(event.timestamp)}
                </Mono>
                <Divider vertical />
                <Mono className="text-[11px] text-ink-400">{Math.round(event.confidence * 100)}%</Mono>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-md hover:bg-ink-800 flex items-center justify-center">
            <icons.X size={15} className="text-ink-300" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-6 space-y-5">
          {AGENTS.map((agent) => {
            const stage = event[agent.id];
            if (!stage) {
              return (
                <div key={agent.id} className="pl-3 border-l-2" style={{ borderColor: agent.color, opacity: 0.4 }}>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: agent.color }}>
                      {agent.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-500">skipped</span>
                  </div>
                  <div className="text-[12.5px] text-ink-500 italic mt-1">No output for this run.</div>
                </div>
              );
            }
            return (
              <div key={agent.id} className="pl-3 border-l-2" style={{ borderColor: agent.color }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-semibold" style={{ color: agent.color }}>
                      {agent.name}
                    </span>
                    {stage.verdict && (
                      <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-ink-800 text-ink-300">
                        {stage.verdict.replace("_", " ")}
                      </span>
                    )}
                  </div>
                  {stage.timing_ms != null && (
                    <Mono className="text-[10.5px] text-ink-500">{stage.timing_ms}ms</Mono>
                  )}
                </div>
                <div className="text-[13px] text-ink-100 mt-1.5 leading-relaxed">{stage.sentence}</div>
                {stage.failing_rule && (
                  <div className="text-[11px] text-ink-500 mt-1 font-mono">rule: {stage.failing_rule}</div>
                )}
                {stage.json && (
                  <details className="mt-2.5">
                    <summary className="text-[11px] text-ink-500 hover:text-ink-300">Show technical details</summary>
                    <pre className="mt-2 p-3 rounded bg-ink-950 hairline text-[11px] text-ink-300 overflow-x-auto leading-relaxed">
                      {JSON.stringify(stage.json, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 hairline-t flex items-center justify-between">
          <Mono className="text-[11px] text-ink-500">event {event.id}</Mono>
          <div className="flex items-center gap-2">
            <Btn variant="secondary" size="sm">
              <icons.ExternalLink size={12} />
              Open in workbench
            </Btn>
            <Btn variant="outline" size="sm" onClick={onClose}>
              Close
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AgentsView({ events }: { events: UiAgentEvent[] }) {
  const [openRun, setOpenRun] = useState<string | null>(null);
  const openEvent = events.find((e) => e.id === openRun) ?? null;

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="px-8 pt-6 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink-100">Agents</h1>
          <div className="text-[12.5px] text-ink-400 mt-1">
            Four agents, one decision per event. Tap any output to see the full trace.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[12px] text-ink-400">
            <icons.Activity size={13} className="text-em" />
            <Mono className="text-ink-200">{events.length}</Mono> runs today
          </div>
          <Divider vertical />
          <Btn variant="secondary" size="sm">
            <icons.RefreshCw size={12} />
            Refresh
          </Btn>
        </div>
      </div>

      <div className="px-8 pb-8 grid grid-cols-2 gap-5">
        {AGENTS.map((agent) => (
          <AgentCard key={agent.id} agent={agent} runs={events} onOpenRun={setOpenRun} />
        ))}
      </div>

      <RunDrawer event={openEvent} onClose={() => setOpenRun(null)} />
    </div>
  );
}
