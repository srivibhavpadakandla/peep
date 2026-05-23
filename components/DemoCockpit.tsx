"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import type { CameraEvent } from "@/lib/contract";
import VisionAgent from "./VisionAgent";
import InboxPanel from "./InboxPanel";
import SecurityAlertsPanel, { type CrimeConfig } from "./SecurityAlertsPanel";

export default function DemoCockpit() {
  const lastEvent = useAgentStore((s) => s.lastEvent);
  const status = useAgentStore((s) => s.status);
  const decision = useAgentStore((s) => s.decision);
  const result = useAgentStore((s) => s.result);
  const log = useAgentStore((s) => s.log);
  const setDecision = useAgentStore((s) => s.setDecision);
  const setResult = useAgentStore((s) => s.setResult);
  const setError = useAgentStore((s) => s.setError);
  const setStatus = useAgentStore((s) => s.setStatus);
  const reset = useAgentStore((s) => s.reset);
  const lastHandled = useRef<number>(0);
  const [target, setTarget] = useState("backpack");
  const [orchestrationMode, setOrchestrationMode] = useState<string>("");
  const [crimeConfig, setCrimeConfig] = useState<CrimeConfig>({
    enabled: true,
    quietHoursEnabled: true,
    quietHoursStart: 22,
    quietHoursEnd: 5,
    dwellMs: 5000,
    cooldownMs: 60_000,
    oncePerSession: true,
    sessionClearMs: 10_000,
    requireMovement: false,
    movementThresholdPx: 60,
  });

  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.timestamp === lastHandled.current) return;
    lastHandled.current = lastEvent.timestamp;
    void runPipeline(lastEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent]);

  async function runPipeline(event: CameraEvent) {
    try {
      setStatus("orchestrating");
      const decRes = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(event),
      });
      const decision = await decRes.json();
      if (!decRes.ok) throw new Error(decision.error ?? `orchestrate ${decRes.status}`);
      setOrchestrationMode(decision._mode ?? "");
      setDecision(decision);

      const actRes = await fetch("/api/browser-agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ workflow: decision.workflow, params: decision.params }),
      });
      const result = await actRes.json();
      if (!actRes.ok) throw new Error(result.error ?? `browser-agent ${actRes.status}`);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[640px_1fr] gap-6">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-neutral-400">Target class:</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
          >
            {/* COCO-SSD classes likely to work as stand-in packages */}
            {["backpack", "handbag", "suitcase", "book", "cell phone", "bottle", "cup", "laptop"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            className="ml-auto text-xs px-2 py-1 border border-neutral-700 rounded hover:bg-neutral-900"
            onClick={() => reset()}
          >
            reset
          </button>
        </div>
        <VisionAgent key={target} targetLabel={target} crimeOptions={crimeConfig} />
        <InboxPanel />
        <SecurityAlertsPanel config={crimeConfig} onChange={setCrimeConfig} />
      </div>

      <div className="space-y-4">
        <Panel title="Pipeline" badge={status}>
          <PipelineGraph status={status} />
        </Panel>

        <Panel title="Last vision event" badge={lastEvent ? lastEvent.event_type : "—"}>
          {lastEvent ? (
            <pre className="text-xs whitespace-pre-wrap break-all">
{JSON.stringify(
  { ...lastEvent, evidence_clip: { ...lastEvent.evidence_clip, url: lastEvent.evidence_clip.url.slice(0, 40) + "…" } },
  null,
  2,
)}
            </pre>
          ) : (
            <Empty>No events yet. Hold a {target} in frame for ~1s, then remove it.</Empty>
          )}
          {lastEvent && (
            <video
              src={lastEvent.evidence_clip.url}
              controls
              className="mt-2 w-full max-w-sm rounded border border-neutral-800"
            />
          )}
        </Panel>

        <Panel title="Orchestration decision" badge={orchestrationMode ? `via ${orchestrationMode}` : "—"}>
          {decision ? (
            <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(decision, null, 2)}</pre>
          ) : (
            <Empty>Waiting for an event…</Empty>
          )}
        </Panel>

        <Panel title="Browser agent result" badge={result ? (result.success ? "success" : "failed") : "—"}>
          {result ? (
            <div className="space-y-2">
              <pre className="text-xs whitespace-pre-wrap break-all">
{JSON.stringify({ ...result, screenshot_data_url: result.screenshot_data_url ? "<truncated>" : undefined }, null, 2)}
              </pre>
              {result.screenshot_data_url && (
                <img
                  src={result.screenshot_data_url}
                  alt="agent screenshot"
                  className="mt-2 w-full max-w-sm rounded border border-neutral-800"
                />
              )}
            </div>
          ) : (
            <Empty>Waiting for an orchestration decision…</Empty>
          )}
        </Panel>

        <Panel title="Activity log">
          <div className="text-[11px] font-mono space-y-0.5 max-h-48 overflow-y-auto">
            {log.length === 0 && <Empty>Nothing yet.</Empty>}
            {log.map((l, i) => (
              <div key={i} className={l.level === "error" ? "text-red-400" : "text-neutral-300"}>
                <span className="text-neutral-500">{new Date(l.ts).toLocaleTimeString()}</span>{" "}
                <span className="text-neutral-500">[{l.source}]</span> {l.message}
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="border border-neutral-800 rounded bg-neutral-950 p-3">
      <header className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-neutral-200">{title}</h2>
        {badge && <span className="text-[10px] uppercase tracking-wide text-neutral-500">{badge}</span>}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-neutral-500">{children}</p>;
}

function PipelineGraph({ status }: { status: string }) {
  const steps = [
    { id: "watching", label: "Vision" },
    { id: "event_detected", label: "Event" },
    { id: "orchestrating", label: "Claude" },
    { id: "acting", label: "Browser" },
    { id: "done", label: "Receipt" },
  ];
  const order = ["watching", "event_detected", "orchestrating", "acting", "done"];
  const activeIdx = order.indexOf(status);
  return (
    <div className="flex items-center gap-1 text-xs">
      {steps.map((s, i) => {
        const reached = i <= activeIdx;
        return (
          <div key={s.id} className="flex items-center gap-1">
            <span
              className={`px-2 py-1 rounded border ${
                reached ? "border-emerald-500 text-emerald-400" : "border-neutral-800 text-neutral-500"
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && <span className={reached ? "text-emerald-500" : "text-neutral-700"}>→</span>}
          </div>
        );
      })}
    </div>
  );
}
