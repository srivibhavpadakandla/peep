"use client";

import { icons } from "lucide-react";
import { AGENTS, EVENT_META, SEVERITY, fmtTimeS, type UiAgentEvent } from "./data";
import { Divider, Mono, Pill, SectionLabel, SeverityChip, StatusDot } from "./primitives";

interface Props {
  events: UiAgentEvent[];
  activeEventId: string;
  activeAgentId: string;
  flashKey: number;
}

function AgentRow({
  agent,
  event,
  isActive,
}: {
  agent: (typeof AGENTS)[number];
  event: UiAgentEvent;
  isActive: boolean;
}) {
  const stage = event[agent.id];
  if (!stage && agent.id !== "executor") return null;
  return (
    <div className={"relative px-4 py-3.5 transition-colors " + (isActive ? "bg-em-soft" : "")}>
      <div
        className="absolute left-0 top-0 bottom-0 w-[2px]"
        style={{ background: agent.color, opacity: isActive ? 1 : 0.25 }}
      />
      <div className="flex items-start gap-3">
        <div className="relative mt-[3px]">
          <div className="w-2 h-2 rounded-full" style={{ background: agent.color }} />
          {isActive && (
            <div
              className="absolute inset-0 w-2 h-2 rounded-full animate-pulse-dot"
              style={{ background: agent.color }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold tracking-tight" style={{ color: agent.color }}>
                {agent.name}
              </span>
              {stage?.verdict && (
                <span
                  className={
                    "text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded " +
                    (stage.verdict === "REAL"
                      ? "bg-em-soft text-em"
                      : stage.verdict === "FALSE_POSITIVE"
                      ? "bg-red-500/10 text-red-400"
                      : stage.verdict === "DROPPED"
                      ? "bg-ink-700 text-ink-300"
                      : "bg-amber-500/10 text-amber-400")
                  }
                >
                  {stage.verdict.replace("_", " ")}
                </span>
              )}
            </div>
            {stage?.timing_ms != null && stage.timing_ms > 0 && (
              <Mono className="text-[10px] text-ink-400">{stage.timing_ms}ms</Mono>
            )}
          </div>
          <div className="text-[12.5px] text-ink-200 mt-1 leading-snug">
            {stage ? stage.sentence : <span className="text-ink-500 italic">Waiting…</span>}
          </div>
          {stage?.failing_rule && (
            <div className="text-[10.5px] text-ink-500 mt-1.5 font-mono">rule: {stage.failing_rule}</div>
          )}
        </div>
      </div>
      {stage?.json && (
        <details className="mt-2 ml-5">
          <summary className="text-[10.5px] text-ink-500 hover:text-ink-300 inline-flex items-center gap-1">
            <icons.ChevronRight size={10} />
            Show technical details
          </summary>
          <pre className="mt-2 p-2.5 rounded bg-ink-900 hairline text-[10.5px] text-ink-300 overflow-x-auto leading-relaxed">
            {JSON.stringify(stage.json, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

export default function AgentPanel({ events, activeEventId, activeAgentId, flashKey }: Props) {
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];
  if (!activeEvent) {
    return (
      <div className="h-full flex flex-col bg-ink-900 hairline-l p-6">
        <SectionLabel>Agent thought process</SectionLabel>
        <div className="mt-6 text-[13px] text-ink-300">No agent runs yet.</div>
        <div className="mt-1 text-[12px] text-ink-500 leading-snug">
          Trigger an event in the Workbench, or import a video to inspect.
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col bg-ink-900 hairline-l">
      <div className="px-5 pt-5 pb-3 hairline-b">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-ink-100">Agent thought process</div>
            <div className="text-[11px] text-ink-400 mt-0.5">Live trace of the current event</div>
          </div>
          <Pill color="#10b981">
            <StatusDot color="#10b981" pulse />
            Live
          </Pill>
        </div>
      </div>

      <div key={flashKey} className="px-5 py-4 hairline-b animate-flash">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[16px]">{EVENT_META[activeEvent.type].emoji}</span>
              <span className="text-[13.5px] font-semibold text-ink-100">
                {EVENT_META[activeEvent.type].label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <SeverityChip sev={EVENT_META[activeEvent.type].severity} />
              <Divider vertical />
              <Mono className="text-[11px] text-ink-400">{Math.round(activeEvent.confidence * 100)}%</Mono>
              <Divider vertical />
              <span className="text-[11px] text-ink-400">{fmtTimeS(activeEvent.timestamp)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        {AGENTS.map((agent, i) => (
          <div key={agent.id} className={i < AGENTS.length - 1 ? "hairline-b" : ""}>
            <AgentRow agent={agent} event={activeEvent} isActive={agent.id === activeAgentId} />
          </div>
        ))}

        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between">
            <SectionLabel>Last 5 runs</SectionLabel>
            <Mono className="text-[10px] text-ink-500">most recent first</Mono>
          </div>
        </div>
        <div className="px-3 pb-5 space-y-1">
          {events.slice(0, 5).map((ev) => {
            const sev = EVENT_META[ev.type].severity;
            const totalMs =
              (ev.vision?.timing_ms || 0) +
              (ev.orchestrator?.timing_ms || 0) +
              (ev.reasoning?.timing_ms || 0) +
              (ev.executor?.timing_ms || 0);
            return (
              <div
                key={ev.id}
                className="px-2 py-2 rounded-md hover:bg-ink-850 flex items-center gap-2 cursor-pointer"
              >
                <span className="w-1 h-6 rounded" style={{ background: SEVERITY[sev].color }} />
                <span className="text-[12.5px]">{EVENT_META[ev.type].emoji}</span>
                <span className="text-[12px] text-ink-200 truncate flex-1">{EVENT_META[ev.type].label}</span>
                <Mono className="text-[10.5px] text-ink-500">{totalMs}ms</Mono>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

