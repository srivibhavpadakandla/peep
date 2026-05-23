"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import type { CameraEvent } from "@/lib/contract";
import type { PipelineResult } from "@/lib/agents/types";

interface Props {
  /** Loitering threshold (ms) — passed through to the reasoning agent. */
  loiteringThresholdMs: number;
}

interface HistoryEntry {
  event: CameraEvent;
  result: PipelineResult;
  ranAt: number;
}

const STAGE_LABELS = ["Orchestrate", "Reason", "Execute"] as const;

export default function AgentPipelinePanel({ loiteringThresholdMs }: Props) {
  const lastEvent = useAgentStore((s) => s.lastEvent);
  const appendAgentRun = useAgentStore((s) => s.appendAgentRun);
  const [autoRun, setAutoRun] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runningStage, setRunningStage] = useState<0 | 1 | 2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<HistoryEntry[]>([]);
  const handledRef = useRef<number>(0);
  // Keep a small history for the flicker check the reasoning agent runs.
  const historyRef = useRef<CameraEvent[]>([]);

  useEffect(() => {
    if (!lastEvent) return;
    // Always update history regardless of autoRun.
    historyRef.current = [...historyRef.current.slice(-9), lastEvent];
    if (!autoRun) return;
    if (lastEvent.timestamp === handledRef.current) return;
    handledRef.current = lastEvent.timestamp;
    void run(lastEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent, autoRun]);

  const run = async (event: CameraEvent) => {
    setRunning(true);
    setError(null);
    setResult(null);
    setRunningStage(0);
    // Visual progression — paces the stage dots even if the request resolves fast.
    const t1 = setTimeout(() => setRunningStage(1), 250);
    const t2 = setTimeout(() => setRunningStage(2), 600);
    try {
      const res = await fetch("/api/agent/pipeline", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event,
          // History excludes the event itself (the reasoning agent ignores ties).
          history: historyRef.current.filter((h) => h.timestamp !== event.timestamp),
          loiteringThresholdMs,
        }),
      });
      const data = (await res.json()) as PipelineResult;
      if (!res.ok) throw new Error((data as unknown as { error?: string }).error ?? `pipeline ${res.status}`);
      setResult(data);
      const ranAt = Date.now();
      setRunHistory((h) => [{ event, result: data, ranAt }, ...h].slice(0, 12));
      appendAgentRun({ ran_at: ranAt, event, result: data });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      clearTimeout(t1);
      clearTimeout(t2);
      setRunning(false);
      setRunningStage(null);
    }
  };

  return (
    <section className="border border-neutral-800 rounded bg-neutral-950 p-3 space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-neutral-200">Agentic pipeline</h2>
          <p className="text-[11px] text-neutral-500">
            Three stages: orchestrate → reason → execute. Executor sends one Gmail.
          </p>
        </div>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none shrink-0">
          <input
            type="checkbox"
            checked={autoRun}
            onChange={(e) => setAutoRun(e.target.checked)}
            className="accent-emerald-500"
          />
          <span>Auto-run on every event</span>
        </label>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => lastEvent && run(lastEvent)}
          disabled={!lastEvent || running}
          className="px-3 py-1.5 text-xs rounded border border-emerald-700 text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50"
        >
          {running ? "Running…" : "Run on last event"}
        </button>
        {result?.email_sent && (
          <span className="text-[11px] px-2 py-0.5 rounded border border-emerald-700 text-emerald-300 bg-emerald-950/40">
            📧 Email sent · {result.executor?.message_id?.slice(0, 12)}…
          </span>
        )}
        {result?.timings && (
          <span className="text-[10px] text-neutral-500 font-mono ml-auto">
            total {result.timings.total_ms}ms
          </span>
        )}
        {error && <span className="text-[11px] text-red-400">{error}</span>}
      </div>

      {/* Live pipeline progress strip */}
      <PipelineProgress
        running={running}
        runningStage={runningStage}
        result={result}
      />

      {/* Event history strip — click any to replay */}
      {runHistory.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">
            Recent runs (click to replay)
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {runHistory.map((h) => {
              const tone = h.result.email_sent
                ? "border-emerald-700 text-emerald-300 bg-emerald-950/30"
                : h.result.reasoning?.verdict === "false_positive"
                ? "border-amber-700 text-amber-300 bg-amber-950/30"
                : h.result.orchestrator.next === "skip"
                ? "border-neutral-700 text-neutral-400 bg-neutral-900/40"
                : "border-sky-700 text-sky-300 bg-sky-950/30";
              const marker = h.result.email_sent
                ? "✉"
                : h.result.reasoning?.verdict === "false_positive"
                ? "✗"
                : h.result.orchestrator.next === "skip"
                ? "—"
                : "•";
              return (
                <button
                  key={`${h.event.timestamp}-${h.ranAt}`}
                  onClick={() => run(h.event)}
                  disabled={running}
                  className={`shrink-0 text-[10px] font-mono px-2 py-1 border rounded ${tone} hover:opacity-100 opacity-90 disabled:opacity-50`}
                  title={`${h.event.event_type} · conf ${h.event.confidence.toFixed(2)}\n${h.result.reasoning?.rationale ?? h.result.orchestrator.reason}`}
                >
                  {marker} {new Date(h.event.timestamp).toLocaleTimeString().slice(0, 5)} ·{" "}
                  {h.event.event_type.split("_")[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!result && <p className="text-xs text-neutral-500">No agentic run yet. Click "Run on last event" once something has fired.</p>}

      {result && (
        <div className="space-y-2">
          <Stage
            title="1. Orchestrator"
            badge={result.orchestrator.workflow}
            color={result.orchestrator.next === "skip" ? "neutral" : "blue"}
            json={result.orchestrator}
            ms={result.timings?.orchestrator_ms}
          >
            <p className="text-xs text-neutral-200">
              <span className="font-medium">{result.orchestrator.workflow}</span> — {result.orchestrator.reason}
            </p>
          </Stage>

          {result.reasoning ? (
            <Stage
              title="2. Reasoning"
              badge={result.reasoning.verdict}
              color={result.reasoning.verdict === "real" ? "emerald" : "amber"}
              json={result.reasoning}
              ms={result.timings?.reasoning_ms}
            >
              <p className="text-xs text-neutral-200">
                <span className="font-medium">{result.reasoning.verdict.toUpperCase()}</span>
                {" — "}
                {result.reasoning.rationale}
              </p>
              {result.reasoning.alert_summary && (
                <p className="text-[11px] text-neutral-400 mt-1">
                  Subject preview: <code className="text-neutral-200">{result.reasoning.alert_summary}</code>
                </p>
              )}
            </Stage>
          ) : (
            <Skipped step="Reasoning" reason="orchestrator skipped the event" />
          )}

          {result.executor ? (
            <Stage
              title="3. Executor"
              badge={result.executor.success ? "done" : "failed"}
              color={result.executor.success ? "emerald" : "red"}
              json={result.executor}
              ms={result.timings?.executor_ms}
            >
              {result.executor.success ? (
                <div className="text-xs space-y-0.5">
                  <p className="text-emerald-300">
                    ✓ {result.executor.workflow}
                    {result.executor.message_id ? ` · sent` : ""}
                  </p>
                  {result.executor.message_id && (
                    <p className="text-[11px] text-neutral-400">
                      Gmail message id: <code className="text-neutral-200">{result.executor.message_id}</code>
                    </p>
                  )}
                  {result.executor.sent_at && (
                    <p className="text-[11px] text-neutral-500">at {new Date(result.executor.sent_at).toLocaleTimeString()}</p>
                  )}
                  {result.executor.error && (
                    <p className="text-[11px] text-amber-300">{result.executor.error}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-red-300">✗ {result.executor.error}</p>
              )}
            </Stage>
          ) : (
            <Skipped step="Executor" reason={result.reasoning ? "verdict was false_positive" : "orchestrator skipped"} />
          )}
        </div>
      )}
    </section>
  );
}

function Stage({
  title,
  badge,
  color,
  json,
  ms,
  children,
}: {
  title: string;
  badge: string;
  color: "neutral" | "blue" | "emerald" | "amber" | "red";
  json: unknown;
  ms?: number;
  children: React.ReactNode;
}) {
  const cls = {
    neutral: "border-neutral-700 text-neutral-300 bg-neutral-900/40",
    blue: "border-sky-700 text-sky-300 bg-sky-950/40",
    emerald: "border-emerald-700 text-emerald-300 bg-emerald-950/40",
    amber: "border-amber-700 text-amber-300 bg-amber-950/40",
    red: "border-red-700 text-red-300 bg-red-950/40",
  }[color];
  return (
    <div className="border border-neutral-800 rounded p-2 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wide text-neutral-500">{title}</span>
        <div className="flex items-center gap-1.5">
          {typeof ms === "number" && (
            <span className="text-[10px] text-neutral-500 font-mono tabular-nums">{ms}ms</span>
          )}
          <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${cls}`}>{badge}</span>
        </div>
      </div>
      {children}
      <details className="text-[10px] text-neutral-500">
        <summary className="cursor-pointer">Stage JSON</summary>
        <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(json, null, 2)}</pre>
      </details>
    </div>
  );
}

function PipelineProgress({
  running,
  runningStage,
  result,
}: {
  running: boolean;
  runningStage: 0 | 1 | 2 | null;
  result: PipelineResult | null;
}) {
  // Each stage state: "idle" | "running" | "done" | "skipped" | "failed"
  type StageState = "idle" | "running" | "done" | "skipped" | "failed";
  const states: StageState[] = [0, 1, 2].map((i): StageState => {
    if (running) {
      if (runningStage === null) return "idle";
      if (i < runningStage) return "done";
      if (i === runningStage) return "running";
      return "idle";
    }
    if (!result) return "idle";
    if (i === 0) return "done";
    if (i === 1) {
      if (result.orchestrator.next === "skip") return "skipped";
      return result.reasoning ? "done" : "skipped";
    }
    // i === 2 (executor)
    if (!result.reasoning || result.reasoning.verdict === "false_positive") return "skipped";
    if (!result.executor) return "skipped";
    return result.executor.success ? "done" : "failed";
  });

  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px]">
      {STAGE_LABELS.map((label, i) => {
        const s = states[i];
        const dotCls =
          s === "running"
            ? "bg-emerald-400 animate-pulse"
            : s === "done"
            ? "bg-emerald-500"
            : s === "failed"
            ? "bg-red-500"
            : s === "skipped"
            ? "bg-neutral-700"
            : "bg-neutral-800";
        const textCls =
          s === "running"
            ? "text-emerald-300"
            : s === "done"
            ? "text-emerald-400"
            : s === "failed"
            ? "text-red-400"
            : s === "skipped"
            ? "text-neutral-600 line-through"
            : "text-neutral-500";
        return (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotCls}`} />
            <span className={`uppercase tracking-wider ${textCls}`}>{label}</span>
            {i < 2 && (
              <span className="text-neutral-700 mx-0.5">
                {states[i + 1] === "running" ? "─▶" : "──"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Skipped({ step, reason }: { step: string; reason: string }) {
  return (
    <div className="border border-dashed border-neutral-800 rounded p-2 text-[11px] text-neutral-500">
      {step} skipped — {reason}.
    </div>
  );
}
