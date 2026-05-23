"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import type { CameraEvent } from "@/lib/contract";
import VisionAgent from "./VisionAgent";
import InboxPanel from "./InboxPanel";
import SecurityAlertsPanel, { type CrimeConfig, type AnimalConfig } from "./SecurityAlertsPanel";
import {
  confidencePercent,
  confidenceQual,
  decisionSentence,
  eventDescription,
  eventEmoji,
  eventTitle,
  formatReceiptId,
  resultSentence,
} from "@/lib/labels";

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
  const [animalConfig, setAnimalConfig] = useState<AnimalConfig>({
    enabled: true,
    animalLabels: ["dog", "bear"],
    cooldownMs: 60_000,
    oncePerSession: true,
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
        <VisionAgent
          key={target}
          targetLabel={target}
          crimeOptions={crimeConfig}
          animalOptions={{
            enabled: animalConfig.enabled,
            animalLabels: animalConfig.animalLabels,
            cooldownMs: animalConfig.cooldownMs,
            oncePerSession: animalConfig.oncePerSession,
          }}
        />
        <InboxPanel />
        <SecurityAlertsPanel
          config={crimeConfig}
          onChange={setCrimeConfig}
          animalConfig={animalConfig}
          onAnimalChange={setAnimalConfig}
        />
      </div>

      <div className="space-y-4">
        <Panel title="Live status" badge={statusLabel(status)}>
          <PipelineGraph status={status} />
        </Panel>

        <Panel
          title="What just happened"
          badge={lastEvent ? `${confidencePercent(lastEvent.confidence)} sure` : "—"}
        >
          {lastEvent ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-2xl leading-none">{eventEmoji(lastEvent.event_type)}</span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-100">{eventTitle(lastEvent.event_type)}</div>
                  <div className="text-xs text-neutral-400">{eventDescription(lastEvent)}</div>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    Detected at {new Date(lastEvent.timestamp).toLocaleTimeString()} ·{" "}
                    {confidenceQual(lastEvent.confidence)} confidence ({confidencePercent(lastEvent.confidence)})
                  </div>
                </div>
              </div>
              <video
                src={lastEvent.evidence_clip.url}
                controls
                className="w-full max-w-sm rounded border border-neutral-800"
              />
              <details className="text-[10px] text-neutral-500">
                <summary className="cursor-pointer">Show technical details</summary>
                <pre className="mt-1 whitespace-pre-wrap break-all">
{JSON.stringify(
  { ...lastEvent, evidence_clip: { ...lastEvent.evidence_clip, url: lastEvent.evidence_clip.url.slice(0, 40) + "…" } },
  null,
  2,
)}
                </pre>
              </details>
            </div>
          ) : (
            <Empty>Nothing's happened yet. Walk in front of the camera or hold a {target} in frame.</Empty>
          )}
        </Panel>

        <Panel
          title="What Peep decided to do"
          badge={orchestrationMode === "claude" ? "Decided by Claude" : orchestrationMode === "mock" ? "Decided by rules" : "—"}
        >
          {decision ? (
            <div className="space-y-2">
              <div className="text-sm text-neutral-100">{decisionSentence(decision)}</div>
              {decision.reason && (
                <div className="text-xs text-neutral-400 italic">"{decision.reason}"</div>
              )}
              <details className="text-[10px] text-neutral-500">
                <summary className="cursor-pointer">Show technical details</summary>
                <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(decision, null, 2)}</pre>
              </details>
            </div>
          ) : (
            <Empty>Waiting for the next event…</Empty>
          )}
        </Panel>

        <Panel
          title="What Peep did about it"
          badge={result ? (result.success ? "Done" : "Failed") : "—"}
        >
          {result ? (
            <div className="space-y-2">
              <div className={`text-sm ${result.success ? "text-emerald-300" : "text-red-300"}`}>
                {result.success ? "✓ " : "✗ "}
                {resultSentence(result)}
              </div>
              {result.receipt_id && result.success && (
                <div className="text-[11px] text-neutral-400">
                  Reference: <code className="text-neutral-200">{formatReceiptId(result.receipt_id)}</code>
                </div>
              )}
              {result.screenshot_data_url && (
                <img
                  src={result.screenshot_data_url}
                  alt="screenshot of what Peep did"
                  className="w-full max-w-sm rounded border border-neutral-800"
                />
              )}
              <details className="text-[10px] text-neutral-500">
                <summary className="cursor-pointer">Show technical details</summary>
                <pre className="mt-1 whitespace-pre-wrap break-all">
{JSON.stringify({ ...result, screenshot_data_url: result.screenshot_data_url ? "<truncated>" : undefined }, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <Empty>Waiting for Peep to decide what to do…</Empty>
          )}
        </Panel>

        <Panel title="Recent activity">
          <div className="text-xs space-y-1 max-h-56 overflow-y-auto">
            {log.length === 0 && <Empty>Nothing yet.</Empty>}
            {log.map((l, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[10px] text-neutral-500 mt-0.5 shrink-0">
                  {new Date(l.ts).toLocaleTimeString()}
                </span>
                <span className={l.level === "error" ? "text-red-400" : "text-neutral-200"}>
                  {l.message}
                </span>
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

function statusLabel(s: string): string {
  switch (s) {
    case "idle": return "Idle";
    case "watching": return "Watching";
    case "event_detected": return "Something happened";
    case "orchestrating": return "Thinking";
    case "acting": return "Acting";
    case "done": return "Done";
    case "error": return "Error";
    default: return s;
  }
}

function PipelineGraph({ status }: { status: string }) {
  const steps = [
    { id: "watching", label: "Watching" },
    { id: "event_detected", label: "Spotted" },
    { id: "orchestrating", label: "Thinking" },
    { id: "acting", label: "Acting" },
    { id: "done", label: "Done" },
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
