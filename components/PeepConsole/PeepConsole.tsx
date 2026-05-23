"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar, { type ViewId } from "./Sidebar";
import AgentPanel from "./AgentPanel";
import LiveView from "./views/Live";
import AgentsView from "./views/Agents";
import InboxView from "./views/Inbox";
import AlertsView from "./views/Alerts";
import LogsView from "./views/Logs";
import UsageView from "./views/Usage";
import SettingsView from "./views/Settings";
import FraudScanPanel from "@/components/FraudScanPanel";
import { useAgentStore, REASONING_SWEEP_INTERVAL_MS } from "@/lib/store";
import { DEMO_EVENTS, EVENT_META, adaptRun, type UiAgentEvent } from "./data";
import type { CrimeConfig, AnimalConfig } from "@/components/SecurityAlertsPanel";

const DEFAULT_CRIME: CrimeConfig = {
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
};

const DEFAULT_ANIMAL: AnimalConfig = {
  enabled: true,
  animalLabels: ["dog", "bear"],
  cooldownMs: 60_000,
  oncePerSession: true,
};

export default function PeepConsole() {
  const [view, setView] = useState<ViewId>("live");
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [source, setSource] = useState<"live" | "import">("live");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [target] = useState("backpack");
  const [crimeConfig] = useState<CrimeConfig>(DEFAULT_CRIME);
  const [animalConfig] = useState<AnimalConfig>(DEFAULT_ANIMAL);
  const [activeAgentId, setActiveAgentId] = useState<"vision" | "orchestrator" | "reasoning" | "executor">("reasoning");
  const [activeEventId, setActiveEventId] = useState<string>(DEMO_EVENTS[0].id);
  const [flashKey, setFlashKey] = useState(0);

  const agentRuns = useAgentStore((s) => s.agentRuns);
  const reasoningSweep = useAgentStore((s) => s.reasoningSweep);

  // Reasoning agent heartbeat: a lightweight background monitoring sweep on a
  // fixed cadence even when no event has fired, drawing down a compute-token
  // budget so the console reads as actively working. Lives in this always-mounted
  // shell so switching views never pauses the sweeps.
  useEffect(() => {
    reasoningSweep();
    const id = setInterval(() => reasoningSweep(), REASONING_SWEEP_INTERVAL_MS);
    return () => clearInterval(id);
  }, [reasoningSweep]);

  // Auto-collapse sidebar at narrow widths.
  useEffect(() => {
    const handler = () => setCollapsed(window.innerWidth < 1200);
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Adapt real agent runs into the UI event shape. When the store is empty,
  // fall back to the design's demo seed so the console isn't a wireframe.
  const events: UiAgentEvent[] = useMemo(() => {
    if (agentRuns.length === 0) return DEMO_EVENTS;
    const real = agentRuns.slice().reverse().map(adaptRun); // newest first
    return real.length >= 5 ? real : [...real, ...DEMO_EVENTS.slice(0, 5 - real.length)];
  }, [agentRuns]);

  // Keep the active event valid as new runs land.
  useEffect(() => {
    if (events.length === 0) return;
    if (!events.find((e) => e.id === activeEventId)) setActiveEventId(events[0].id);
  }, [events, activeEventId]);

  // Cycle agent highlight on the Live view so the right-panel feels alive.
  useEffect(() => {
    if (view !== "live") return;
    const stages: Array<typeof activeAgentId> = ["vision", "orchestrator", "reasoning", "executor"];
    let i = 0;
    const tick = setInterval(() => {
      i = (i + 1) % stages.length;
      setActiveAgentId(stages[i]);
      // Bump flashKey on a full cycle to re-trigger the right-panel flash.
      if (i === 0) setFlashKey((k) => k + 1);
    }, 2000);
    return () => clearInterval(tick);
  }, [view]);

  // Badge counts derived from the live event stream.
  const badgeCounts = useMemo(() => {
    const alertCount = events.filter((e) =>
      ["critical", "high"].includes(EVENT_META[e.type].severity),
    ).length;
    return {
      alerts: { count: alertCount, kind: "alert" as const },
    };
  }, [events]);

  const showRightPanel = view === "live";

  return (
    <div className="w-screen h-screen flex bg-ink-950 text-ink-100 overflow-hidden">
      <Sidebar
        active={view}
        onChange={setView}
        collapsed={collapsed}
        badgeCounts={badgeCounts}
        pendingDeliveries={2}
      />

      <main className="flex-1 min-w-0 flex">
        <div className="flex-1 min-w-0 h-full bg-ink-950 flex flex-col">
          {view === "live" && (
            <LiveView
              events={events}
              activeEventId={activeEventId}
              source={source}
              setSource={setSource}
              videoFile={videoFile}
              setVideoFile={setVideoFile}
              targetLabel={target}
              crimeConfig={crimeConfig}
              animalConfig={animalConfig}
              openDrawer={() => setDrawerOpen(true)}
            />
          )}
          {view === "agents" && <AgentsView events={events} />}
          {view === "fraud" && (
            <div className="h-full overflow-y-auto scroll-thin px-8 py-6">
              <FraudScanPanel />
            </div>
          )}
          {view === "inbox" && <InboxView />}
          {view === "alerts" && <AlertsView events={events} />}
          {view === "logs" && <LogsView />}
          {view === "usage" && <UsageView apiKeySet={true} />}
          {view === "settings" && <SettingsView />}
        </div>

        {showRightPanel && (
          <div className="w-[360px] shrink-0 hidden xl:block h-full">
            <AgentPanel
              events={events}
              activeEventId={activeEventId}
              activeAgentId={activeAgentId}
              flashKey={flashKey}
            />
          </div>
        )}
      </main>

      {showRightPanel && drawerOpen && (
        <div className="fixed inset-0 z-40 xl:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute right-0 top-0 bottom-0 w-[360px] bg-ink-900 animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <AgentPanel
              events={events}
              activeEventId={activeEventId}
              activeAgentId={activeAgentId}
              flashKey={flashKey}
            />
          </div>
        </div>
      )}
    </div>
  );
}
