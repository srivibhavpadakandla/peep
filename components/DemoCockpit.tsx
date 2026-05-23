"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import type { CameraEvent } from "@/lib/contract";
import VisionAgent from "./VisionAgent";
import InboxPanel from "./InboxPanel";
import SecurityAlertsPanel, { type CrimeConfig, type AnimalConfig } from "./SecurityAlertsPanel";
import SettingsPanel from "./SettingsPanel";
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

type Tab = "live" | "activity" | "inbox" | "alerts" | "settings";

const TABS: { id: Tab; label: string; icon: string; description: string }[] = [
  { id: "live", label: "Live", icon: "🎥", description: "Camera + current event" },
  { id: "activity", label: "Activity", icon: "🕒", description: "Recent activity log" },
  { id: "inbox", label: "Inbox", icon: "📬", description: "Expected deliveries" },
  { id: "alerts", label: "Alerts", icon: "🛡", description: "Security alerts" },
  { id: "settings", label: "Settings", icon: "⚙", description: "Inbox source + integrations" },
];

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
  const [tab, setTab] = useState<Tab>("live");
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
    <div className="grid grid-cols-1 lg:grid-cols-[180px_640px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="space-y-1">
        <div className="px-3 py-2 mb-2">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500">Status</div>
          <div className="text-sm text-neutral-200 mt-0.5 flex items-center gap-1.5">
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ${
                status === "watching" || status === "done"
                  ? "bg-emerald-500"
                  : status === "error"
                  ? "bg-red-500"
                  : "bg-amber-500"
              }`}
            />
            {statusLabel(status)}
          </div>
        </div>

        <nav className="space-y-0.5">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                  active
                    ? "bg-neutral-900 text-neutral-100 border border-neutral-700"
                    : "text-neutral-400 hover:bg-neutral-900/50 border border-transparent"
                }`}
              >
                <span className="flex-1">{t.label}</span>
                {active && <span className="w-1 h-4 bg-emerald-500 rounded-sm" />}
              </button>
            );
          })}
        </nav>

        <div className="px-3 pt-4 mt-4 border-t border-neutral-900 text-[10px] text-neutral-500">
          {TABS.find((t) => t.id === tab)?.description}
        </div>

        <button
          className="w-full text-left px-3 py-2 mt-2 text-xs text-neutral-500 hover:text-neutral-300"
          onClick={() => reset()}
        >
          ↻ Reset pipeline
        </button>
      </aside>

      {/* Camera column — always rendered so the vision agent keeps running */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-neutral-400">Target class:</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-1"
          >
            {["backpack", "handbag", "suitcase", "book", "cell phone", "bottle", "cup", "laptop"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
        <Panel title="Live status" badge={statusLabel(status)}>
          <PipelineGraph status={status} />
        </Panel>
      </div>

      {/* Main content — swaps per tab */}
      <div className="space-y-4">
        {tab === "live" && (
          <>
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
              badge={
                orchestrationMode === "claude"
                  ? "Decided by Claude"
                  : orchestrationMode === "mock"
                  ? "Decided by rules"
                  : "—"
              }
            >
              {decision ? (
                <div className="space-y-2">
                  <div className="text-sm text-neutral-100">{decisionSentence(decision)}</div>
                  {decision.reason && <div className="text-xs text-neutral-400 italic">"{decision.reason}"</div>}
                  <details className="text-[10px] text-neutral-500">
                    <summary className="cursor-pointer">Show technical details</summary>
                    <pre className="mt-1 whitespace-pre-wrap break-all">{JSON.stringify(decision, null, 2)}</pre>
                  </details>
                </div>
              ) : (
                <Empty>Waiting for the next event…</Empty>
              )}
            </Panel>

            <Panel title="What Peep did about it" badge={result ? (result.success ? "Done" : "Failed") : "—"}>
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
          </>
        )}

        {tab === "activity" && (
          <Panel title="Recent activity" badge={`${log.length} entr${log.length === 1 ? "y" : "ies"}`}>
            <div className="text-xs space-y-1.5 max-h-[600px] overflow-y-auto">
              {log.length === 0 && <Empty>No activity yet. Peep is watching.</Empty>}
              {log.slice().reverse().map((l, i) => (
                <div key={i} className="flex items-start gap-3 px-2 py-1.5 rounded hover:bg-neutral-900/30">
                  <span className="text-[10px] text-neutral-500 mt-0.5 shrink-0 w-16 font-mono">
                    {new Date(l.ts).toLocaleTimeString()}
                  </span>
                  <span className={l.level === "error" ? "text-red-400 flex-1" : "text-neutral-200 flex-1"}>
                    {l.message}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* Inbox + Alerts are always mounted (so their internal state survives tab switches),
            but only the active tab is visible. */}
        <div className={tab === "inbox" ? "" : "hidden"}>
          <InboxPanel />
        </div>
        <div className={tab === "alerts" ? "" : "hidden"}>
          <SecurityAlertsPanel
            config={crimeConfig}
            onChange={setCrimeConfig}
            animalConfig={animalConfig}
            onAnimalChange={setAnimalConfig}
          />
        </div>
        <div className={tab === "settings" ? "" : "hidden"}>
          <SettingsPanel />
        </div>
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
    case "idle":
      return "Idle";
    case "watching":
      return "Watching";
    case "event_detected":
      return "Something happened";
    case "orchestrating":
      return "Thinking";
    case "acting":
      return "Acting";
    case "done":
      return "Done";
    case "error":
      return "Error";
    default:
      return s;
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
    <div className="flex items-center gap-1 text-xs flex-wrap">
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
            {i < steps.length - 1 && (
              <span className={reached ? "text-emerald-500" : "text-neutral-700"}>→</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
