"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import type { CameraEvent } from "@/lib/contract";
import type { PipelineResult } from "@/lib/agents/types";

interface Props {
  /** Loitering threshold (ms) — passed through to the reasoning agent. */
  loiteringThresholdMs: number;
}

export default function AgentPipelinePanel({ loiteringThresholdMs }: Props) {
  const lastEvent = useAgentStore((s) => s.lastEvent);
  const [autoRun, setAutoRun] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
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

      <div className="flex items-center gap-2">
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
        {error && <span className="text-[11px] text-red-400">{error}</span>}
      </div>

      {!result && <p className="text-xs text-neutral-500">No agentic run yet. Click "Run on last event" once something has fired.</p>}

      {result && (
        <div className="space-y-2">
          <Stage
            title="1. Orchestrator"
            badge={result.orchestrator.workflow}
            color={result.orchestrator.next === "skip" ? "neutral" : "blue"}
            json={result.orchestrator}
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
  children,
}: {
  title: string;
  badge: string;
  color: "neutral" | "blue" | "emerald" | "amber" | "red";
  json: unknown;
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
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-neutral-500">{title}</span>
        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${cls}`}>{badge}</span>
      </div>
      {children}
      <details className="text-[10px] text-neutral-500">
        <summary className="cursor-pointer">Stage JSON</summary>
        <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(json, null, 2)}</pre>
      </details>
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
