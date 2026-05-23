"use client";

import { useMemo } from "react";
import { useAgentStore, type AgentRun } from "@/lib/store";
import {
  confidencePercent,
  eventEmoji,
  eventTitle,
} from "@/lib/labels";

/**
 * Dedicated view that walks the user through each of the four agents'
 * recent work. Designed to be readable at a glance — minimal JSON, plain
 * English sentences, color-coded verdicts, and "show details" only on
 * demand.
 */
export default function AgentsView() {
  const lastEvent = useAgentStore((s) => s.lastEvent);
  const agentRuns = useAgentStore((s) => s.agentRuns);
  const clearAgentRuns = useAgentStore((s) => s.clearAgentRuns);

  const runsNewestFirst = useMemo(() => agentRuns.slice().reverse(), [agentRuns]);
  const latest = runsNewestFirst[0];

  return (
    <div className="space-y-6">
      <header className="border border-[#2C2C2A] bg-[#171716] p-4 rounded-none">
        <h1 className="text-sm font-mono font-bold tracking-wider text-[#D2E7C9] uppercase">
          Agents
        </h1>
        <p className="text-[11px] text-neutral-500 font-mono">
          Four agents work in sequence. Tap any section to see what it just decided.
        </p>
      </header>

      <AgentSection
        name="Vision Agent"
        subtitle="Watches the camera frame-by-frame and emits structured events."
        accent="cyan"
      >
        <VisionAgentSummary lastEvent={lastEvent} />
      </AgentSection>

      <AgentSection
        name="Orchestrator"
        subtitle="Drops anything below 50% confidence. Routes the rest to a workflow."
        accent="blue"
        rightHeader={<RunCount n={runsNewestFirst.filter((r) => r.result.orchestrator).length} />}
      >
        <OrchestratorList runs={runsNewestFirst} />
      </AgentSection>

      <AgentSection
        name="Reasoning Agent"
        subtitle="Verifies events as REAL or FALSE_POSITIVE. Cites the failing rule."
        accent="amber"
        rightHeader={
          <RunCount n={runsNewestFirst.filter((r) => r.result.reasoning).length} />
        }
      >
        <ReasoningList runs={runsNewestFirst} />
      </AgentSection>

      <AgentSection
        name="Executor"
        subtitle="One side effect per real event. Today: sends a single Gmail."
        accent="emerald"
        rightHeader={
          <RunCount n={runsNewestFirst.filter((r) => r.result.executor).length} />
        }
      >
        <ExecutorList runs={runsNewestFirst} />
      </AgentSection>

      {agentRuns.length > 0 && (
        <button
          onClick={clearAgentRuns}
          className="text-[11px] text-neutral-500 hover:text-neutral-300 font-mono"
        >
          ↻ clear agent run history ({agentRuns.length})
        </button>
      )}

      {!latest && (
        <div className="border border-dashed border-neutral-800 rounded p-6 text-center">
          <p className="text-sm text-neutral-300">No agent runs yet.</p>
          <p className="text-[11px] text-neutral-500 mt-1">
            Open the Workbench, turn on <em>Auto-run on every event</em> in the agentic
            pipeline panel, then trigger an event in front of the camera (or import a video).
          </p>
        </div>
      )}
    </div>
  );
}

function AgentSection({
  name,
  subtitle,
  accent,
  rightHeader,
  children,
}: {
  name: string;
  subtitle: string;
  accent: "cyan" | "blue" | "amber" | "emerald";
  rightHeader?: React.ReactNode;
  children: React.ReactNode;
}) {
  const dot = {
    cyan: "bg-cyan-400",
    blue: "bg-sky-400",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
  }[accent];
  return (
    <section className="border border-[#2C2C2A] bg-[#171716] rounded-none">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#2C2C2A]">
        <div className="flex items-center gap-2.5">
          <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
          <div>
            <h2 className="text-sm font-medium text-neutral-100">{name}</h2>
            <p className="text-[11px] text-neutral-500">{subtitle}</p>
          </div>
        </div>
        {rightHeader}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

function RunCount({ n }: { n: number }) {
  return (
    <span className="text-[10px] uppercase tracking-wide text-neutral-500 font-mono">
      {n} run{n === 1 ? "" : "s"}
    </span>
  );
}

function VisionAgentSummary({ lastEvent }: { lastEvent: ReturnType<typeof useAgentStore.getState>["lastEvent"] }) {
  if (!lastEvent) {
    return <p className="text-xs text-neutral-500">Watching. Nothing has been detected yet.</p>;
  }
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{eventEmoji(lastEvent.event_type)}</span>
        <div>
          <div className="text-sm text-neutral-100 font-medium">
            {eventTitle(lastEvent.event_type)}
          </div>
          <div className="text-[11px] text-neutral-400">
            {confidencePercent(lastEvent.confidence)} confidence ·{" "}
            {new Date(lastEvent.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
      {lastEvent.evidence_clip.url.startsWith("blob:") && (
        <video
          src={lastEvent.evidence_clip.url}
          controls
          className="w-full max-w-md rounded border border-neutral-800"
        />
      )}
    </div>
  );
}

function OrchestratorList({ runs }: { runs: AgentRun[] }) {
  if (runs.length === 0) {
    return <p className="text-xs text-neutral-500">No routing decisions yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {runs.slice(0, 5).map((r) => (
        <li key={r.ran_at} className="border border-neutral-800 rounded p-2">
          <div className="flex items-center justify-between text-[11px] text-neutral-500">
            <span>{new Date(r.ran_at).toLocaleTimeString()}</span>
            <span className="font-mono">{r.result.orchestrator.workflow}</span>
          </div>
          <p className="text-xs text-neutral-200 mt-1">
            <span className="text-neutral-500">Saw</span>{" "}
            <span className="font-medium">{eventTitle(r.event.event_type)}</span>{" "}
            <span className="text-neutral-500">→ decided to</span>{" "}
            <span className="font-medium">{workflowSentence(r.result.orchestrator.workflow)}</span>
          </p>
          <p className="text-[11px] text-neutral-400 italic mt-0.5">"{r.result.orchestrator.reason}"</p>
          {r.result.timings?.orchestrator_ms !== undefined && (
            <p className="text-[10px] text-neutral-500 mt-1 font-mono">
              {r.result.timings.orchestrator_ms}ms
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function ReasoningList({ runs }: { runs: AgentRun[] }) {
  const withReasoning = runs.filter((r) => r.result.reasoning);
  if (withReasoning.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No verdicts yet. (Reasoning only runs when the Orchestrator advances.)
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {withReasoning.slice(0, 5).map((r) => {
        const v = r.result.reasoning!;
        const isReal = v.verdict === "real";
        return (
          <li
            key={r.ran_at}
            className={`border rounded p-2 ${
              isReal ? "border-emerald-800/60 bg-emerald-950/20" : "border-amber-800/60 bg-amber-950/10"
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">{new Date(r.ran_at).toLocaleTimeString()}</span>
              <span
                className={`uppercase tracking-wide font-mono text-[10px] ${
                  isReal ? "text-emerald-300" : "text-amber-300"
                }`}
              >
                {v.verdict}
              </span>
            </div>
            <p className="text-xs text-neutral-200 mt-1">
              <span className="text-neutral-500">{isReal ? "✓" : "✗"} </span>
              {v.rationale}
            </p>
            {v.alert_summary && (
              <p className="text-[11px] text-neutral-400 mt-1">
                Would send: <code className="text-neutral-200">{v.alert_summary}</code>
              </p>
            )}
            {r.result.timings?.reasoning_ms !== undefined && (
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                {r.result.timings.reasoning_ms}ms
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ExecutorList({ runs }: { runs: AgentRun[] }) {
  const withExecutor = runs.filter((r) => r.result.executor);
  if (withExecutor.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No actions taken yet. (Executor only runs when Reasoning marks an event REAL.)
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {withExecutor.slice(0, 5).map((r) => {
        const e = r.result.executor!;
        const ok = e.success;
        return (
          <li
            key={r.ran_at}
            className={`border rounded p-2 ${
              ok ? "border-emerald-800/60 bg-emerald-950/20" : "border-red-800/60 bg-red-950/20"
            }`}
          >
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-neutral-500">{new Date(r.ran_at).toLocaleTimeString()}</span>
              <span
                className={`uppercase tracking-wide font-mono text-[10px] ${
                  ok ? "text-emerald-300" : "text-red-300"
                }`}
              >
                {ok ? "done" : "failed"}
              </span>
            </div>
            <p className="text-xs text-neutral-200 mt-1">
              {ok ? "✓ " : "✗ "}
              {executorSentence(e)}
            </p>
            {e.message_id && (
              <p className="text-[11px] text-neutral-400 mt-1">
                Gmail id: <code className="text-neutral-200">{e.message_id}</code>
              </p>
            )}
            {e.error && <p className="text-[11px] text-amber-300 mt-0.5">{e.error}</p>}
            {r.result.timings?.executor_ms !== undefined && (
              <p className="text-[10px] text-neutral-500 mt-1 font-mono">
                {r.result.timings.executor_ms}ms
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function workflowSentence(workflow: string): string {
  switch (workflow) {
    case "send_security_email":
      return "send a security email";
    case "amazon_refund_claim":
      return "file an Amazon refund";
    case "log_incident":
      return "log only";
    case "no_action":
      return "do nothing";
    default:
      return workflow;
  }
}

function executorSentence(e: {
  success: boolean;
  workflow: string;
  message_id?: string;
  error?: string;
}): string {
  if (!e.success) return e.error ?? "something went wrong";
  switch (e.workflow) {
    case "send_security_email":
      return e.message_id ? "Sent the alert email." : "Tried to send but skipped (verdict was false positive).";
    case "amazon_refund_claim":
      return "Handed off to the Amazon refund flow.";
    case "log_incident":
      return "Logged to the activity feed.";
    case "no_action":
      return "No action was needed.";
    default:
      return "Done.";
  }
}
