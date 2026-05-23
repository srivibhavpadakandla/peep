"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import type { CameraEvent } from "@/lib/contract";
import VisionAgent from "./VisionAgent";
import InboxPanel from "./InboxPanel";
import SecurityAlertsPanel, { type CrimeConfig, type AnimalConfig } from "./SecurityAlertsPanel";
import SettingsPanel from "./SettingsPanel";
import AgentPipelinePanel from "./AgentPipelinePanel";
import EventLauncher from "./EventLauncher";
import AgentsView from "./AgentsView";
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
  const error = useAgentStore((s) => s.error);
  
  const setDecision = useAgentStore((s) => s.setDecision);
  const setResult = useAgentStore((s) => s.setResult);
  const setError = useAgentStore((s) => s.setError);
  const setStatus = useAgentStore((s) => s.setStatus);
  const reset = useAgentStore((s) => s.reset);
  
  const lastHandled = useRef<number>(0);
  const [target, setTarget] = useState("backpack");
  const [orchestrationMode, setOrchestrationMode] = useState<string>("");

  // Knobs config from Srivibhav's original dashboard
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

  // Local state for UI Token Metrics (so backend commits are 100% untouched!)
  const [usage, setUsage] = useState({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    costUSD: 0,
    model: "—",
    callsCount: 0,
  });

  // Navigation tab state matching Claude Console tab sections
  const [activeTab, setActiveTab] = useState<"workbench" | "agents" | "logs" | "usage" | "settings">("workbench");

  // Video source for the vision agent: live camera or imported file
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Activity Log Search & Filter States
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<"all" | "vision" | "orchestration" | "browser" | "system">("all");

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

      // Track real pipeline activity. Token counts come from the API only when
      // a real Claude call was made; otherwise we just bump the call counter
      // and leave token/cost at the actual measured values (0 for the mock).
      const usageDelta = (decision as { usage?: { input_tokens: number; output_tokens: number } }).usage;
      setUsage((prev) => ({
        promptTokens: prev.promptTokens + (usageDelta?.input_tokens ?? 0),
        completionTokens: prev.completionTokens + (usageDelta?.output_tokens ?? 0),
        totalTokens:
          prev.totalTokens + (usageDelta ? usageDelta.input_tokens + usageDelta.output_tokens : 0),
        costUSD:
          prev.costUSD +
          (usageDelta ? (usageDelta.input_tokens * 3 + usageDelta.output_tokens * 15) / 1_000_000 : 0),
        model: decision._mode === "claude" ? "Claude (Sonnet 4.6)" : "rule-based router",
        callsCount: prev.callsCount + 1,
      }));

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

  // Handle a complete UI/Zustand reset cleanly
  const handleReset = () => {
    reset();
    setUsage({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      costUSD: 0,
      model: "—",
      callsCount: 0,
    });
  };

  // Filter logs dynamically based on search and source filters
  const filteredLogs = log.filter((l) => {
    const matchesSource = logFilter === "all" || l.source === logFilter;
    const matchesSearch = l.message.toLowerCase().includes(logSearch.toLowerCase()) || 
                          l.source.toLowerCase().includes(logSearch.toLowerCase());
    return matchesSource && matchesSearch;
  });

  // Extract individual orchestration calls from logs for the telemetry table.
  // Token counts and cost are shown ONLY for events we have real measurements
  // for (i.e. a real Claude call was made). Otherwise we leave them blank.
  const orchestrationCalls = log
    .filter((l) => l.source === "orchestration")
    .map((l, idx) => ({
      id: idx + 1,
      timestamp: l.ts,
      message: l.message,
    }));

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#1E1E1D] text-[#E6E6E0] font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Side Panel (Left Sidebar) */}
      <aside className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-[#2C2C2A] bg-[#171716] p-5 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Opaque Light Green Header Banner (Matches screenshot3 y=0 color #383e2a!) */}
          <div className="bg-[#383E2A]/90 border border-[#525D44]/40 p-4 rounded-none shadow-[0_1px_4px_rgba(0,0,0,0.2)]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <h1 className="text-sm font-bold tracking-widest font-mono text-[#D2E7C9]">PEEP</h1>
            </div>
            <p className="text-[9px] text-[#A2C799] font-mono tracking-wider uppercase mt-1">
              Agentic Orchestration Console
            </p>
          </div>

          {/* Clickable Navigation Tabs (Matches Claude Console navigation!) */}
          <nav className="space-y-1">
            <span className="text-[10px] font-semibold text-[#8C8C85] tracking-wider uppercase font-mono block mb-2 px-1">Navigation</span>
            
            <button
              onClick={() => setActiveTab("workbench")}
              className={`w-full text-left font-mono text-[11px] px-3 py-2 rounded-none border transition-all flex items-center justify-between ${
                activeTab === "workbench"
                  ? "bg-[#383E2A]/20 border-[#525D44]/40 text-[#D2E7C9] font-bold"
                  : "bg-transparent border-transparent text-[#8C8C85] hover:text-[#E6E6E0] hover:bg-[#1C1C1B]"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>WORKBENCH</span>
              </div>
              {status === "watching" && <span className="text-[8px] px-1 bg-emerald-950/40 text-emerald-400 font-normal border border-emerald-900/30">LIVE</span>}
            </button>

            <button
              onClick={() => setActiveTab("agents")}
              className={`w-full text-left font-mono text-[11px] px-3 py-2 rounded-none border transition-all flex items-center justify-between ${
                activeTab === "agents"
                  ? "bg-[#383E2A]/20 border-[#525D44]/40 text-[#D2E7C9] font-bold"
                  : "bg-transparent border-transparent text-[#8C8C85] hover:text-[#E6E6E0] hover:bg-[#1C1C1B]"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM12 5v14" />
                </svg>
                <span>AGENTS</span>
              </div>
              <span className="text-[9px] font-normal text-[#8C8C85]">4</span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full text-left font-mono text-[11px] px-3 py-2 rounded-none border transition-all flex items-center justify-between ${
                activeTab === "logs"
                  ? "bg-[#383E2A]/20 border-[#525D44]/40 text-[#D2E7C9] font-bold"
                  : "bg-transparent border-transparent text-[#8C8C85] hover:text-[#E6E6E0] hover:bg-[#1C1C1B]"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>ACTIVITY LOG</span>
              </div>
              <span className="text-[9px] font-normal text-[#8C8C85]">{log.length}</span>
            </button>

            <button
              onClick={() => setActiveTab("usage")}
              className={`w-full text-left font-mono text-[11px] px-3 py-2 rounded-none border transition-all flex items-center justify-between ${
                activeTab === "usage"
                  ? "bg-[#383E2A]/20 border-[#525D44]/40 text-[#D2E7C9] font-bold"
                  : "bg-transparent border-transparent text-[#8C8C85] hover:text-[#E6E6E0] hover:bg-[#1C1C1B]"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>TOKEN METRICS</span>
              </div>
              <span className="text-[9px] font-normal text-emerald-400 font-semibold">${usage.costUSD.toFixed(4)}</span>
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full text-left font-mono text-[11px] px-3 py-2 rounded-none border transition-all flex items-center justify-between ${
                activeTab === "settings"
                  ? "bg-[#383E2A]/20 border-[#525D44]/40 text-[#D2E7C9] font-bold"
                  : "bg-transparent border-transparent text-[#8C8C85] hover:text-[#E6E6E0] hover:bg-[#1C1C1B]"
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>SETTINGS</span>
              </div>
            </button>
          </nav>

          {/* System Status Indicator */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-[#8C8C85] tracking-wider uppercase font-mono">System Status</span>
            <div className={`p-3 border font-mono text-xs rounded-none ${
              status === "error"
                ? "bg-red-950/20 border-red-900/40 text-red-400"
                : status === "done"
                ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                : status === "idle" || status === "watching"
                ? "bg-emerald-950/10 border-[#2C2C2A] text-emerald-500/90"
                : "bg-amber-950/20 border-amber-900/40 text-amber-400"
            }`}>
              <div className="flex items-center justify-between">
                <span>PHASE:</span>
                <span className="font-bold uppercase tracking-wider">{status}</span>
              </div>
              {error && (
                <div className="mt-2 pt-2 border-t border-red-950 text-[10px] text-red-300 break-all whitespace-pre-wrap">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Controls always accessible in the lower sidebar */}
        <div className="space-y-4 pt-4 border-t border-[#2C2C2A] mt-6">
          <span className="text-[10px] font-semibold text-[#8C8C85] tracking-wider uppercase font-mono block">Workbench Config</span>
          
          <div className="space-y-1.5">
            <label className="text-[9px] font-semibold text-[#8C8C85] tracking-wider uppercase font-mono">Target Class</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2C2C2A] text-[#E6E6E0] rounded-none px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-emerald-500/50 transition-colors"
            >
              {["backpack", "handbag", "suitcase", "book", "cell phone", "bottle", "cup", "laptop"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleReset}
            className="w-full text-center text-xs font-mono tracking-wider py-2 border border-[#2C2C2A] text-[#10B981] hover:bg-[#10B981]/10 hover:border-[#10B981]/30 active:bg-[#10B981]/20 transition-all rounded-none bg-[#0A0A0A]"
          >
            RESET PIPELINE
          </button>
        </div>
      </aside>

      {/* Main Workspace (Changes depending on activeTab state!) */}
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        
        {/* Tab 1: WORKBENCH (Main agent dashboard) */}
        {activeTab === "workbench" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Pipeline Graph (Horizontal stepper) */}
            <div className="bg-[#171716] border border-[#2C2C2A] p-4 rounded-none">
              <header className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">Orchestration Graph</h2>
                <span className="text-[9px] font-mono text-emerald-500/60 uppercase">{status}</span>
              </header>
              <PipelineGraph status={status} />
            </div>

            {/* Workspace Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Column: Vision Feed, Inbox, and Security Alerts Panels */}
              <div className="space-y-6">
                {/* Vision Feed Camera Container */}
                <div className="bg-[#171716] border border-[#2C2C2A] p-4 flex flex-col rounded-none">
                  <header className="mb-3 flex items-center justify-between">
                    <h2 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">
                      Vision Feed {videoFile ? "(Imported)" : "(Webcam)"}
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${videoFile ? "bg-sky-400" : "bg-emerald-500 animate-pulse"}`}></span>
                      <span className="text-[9px] font-mono uppercase text-emerald-500/60">
                        {videoFile ? "video import" : "Live Detection"}
                      </span>
                    </div>
                  </header>

                  {/* Source switcher */}
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-mono">
                    <button
                      onClick={() => setVideoFile(null)}
                      className={`px-2 py-1 border ${
                        !videoFile
                          ? "border-emerald-600/60 text-emerald-300 bg-emerald-950/30"
                          : "border-[#2C2C2A] text-[#8C8C85] hover:text-[#E6E6E0]"
                      }`}
                    >
                      LIVE CAMERA
                    </button>
                    <label
                      className={`px-2 py-1 border cursor-pointer ${
                        videoFile
                          ? "border-sky-600/60 text-sky-300 bg-sky-950/30"
                          : "border-[#2C2C2A] text-[#8C8C85] hover:text-[#E6E6E0]"
                      }`}
                    >
                      IMPORT VIDEO…
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0] ?? null;
                          setVideoFile(f);
                          // reset so picking the same file twice still fires onChange
                          e.target.value = "";
                        }}
                      />
                    </label>
                    {videoFile && (
                      <>
                        <span className="text-[10px] text-neutral-400 truncate max-w-[200px]" title={videoFile.name}>
                          {videoFile.name}
                        </span>
                        <button
                          onClick={() => setVideoFile(null)}
                          className="ml-auto text-[10px] text-neutral-500 hover:text-neutral-300"
                        >
                          ✕ remove
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex justify-center">
                    <VisionAgent
                      key={`${target}-${videoFile?.name ?? "live"}`}
                      targetLabel={target}
                      crimeOptions={crimeConfig}
                      animalOptions={{
                        enabled: animalConfig.enabled,
                        animalLabels: animalConfig.animalLabels,
                        cooldownMs: animalConfig.cooldownMs,
                        oncePerSession: animalConfig.oncePerSession,
                      }}
                      videoSource={videoFile ?? "live"}
                    />
                  </div>
                  {videoFile && (
                    <p className="mt-2 text-[10px] text-neutral-500 font-mono leading-relaxed">
                      Detection is running against the video frame-by-frame. Switch to the Agents tab to watch the
                      three agents reason through whatever fires.
                    </p>
                  )}
                </div>

                {/* Srivibhav's Inbox Panel (Fully Integrated!) */}
                <InboxPanel />
              </div>

              {/* Right Column: Current Activity (compact) */}
              <div className="space-y-6">
                <Panel title="Current Activity" badge={lastEvent ? "live" : "idle"}>
                  {lastEvent ? (
                    <CurrentActivityCard
                      lastEvent={lastEvent}
                      decision={decision}
                      result={result}
                      orchestrationMode={orchestrationMode}
                    />
                  ) : (
                    <Empty>Nothing's happened yet. Trigger an event in front of the camera, or import a video file to inspect.</Empty>
                  )}
                  <p className="mt-3 text-[10px] text-neutral-500 font-mono leading-relaxed">
                    Open the <span className="text-[#D2E7C9]">AGENTS</span> tab to see the full thought process —
                    what each agent saw, decided, and did.
                  </p>
                </Panel>
              </div>
            </div>

            {/* Test event launcher — fire synthetic CameraEvents into the pipeline */}
            <EventLauncher />

            {/* Agentic three-stage pipeline (Orchestrator → Reasoning → Executor → Gmail) */}
            <AgentPipelinePanel loiteringThresholdMs={crimeConfig.dwellMs} />
          </div>
        )}

        {/* Tab: AGENTS — dedicated view, one section per agent */}
        {activeTab === "agents" && (
          <div className="animate-fadeIn">
            <AgentsView />
          </div>
        )}

        {/* Tab 2: DEDICATED ACTIVITY LOG VIEW */}
        {activeTab === "logs" && (
          <div className="space-y-4 animate-fadeIn">
            {/* Log Control Header */}
            <div className="bg-[#171716] border border-[#2C2C2A] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none">
              <div className="space-y-1">
                <h2 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">Peep TTY System Logs</h2>
                <p className="text-[10px] text-neutral-500 font-mono">
                  Displaying {filteredLogs.length} of {log.length} live system messages
                </p>
              </div>

              {/* Filtering Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by keyword..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="bg-[#0A0A0A] border border-[#2C2C2A] px-3 py-1 text-[11px] font-mono focus:outline-none focus:border-emerald-500/50 text-[#E6E6E0]"
                />

                {(["all", "vision", "orchestration", "browser", "system"] as const).map((source) => (
                  <button
                    key={source}
                    onClick={() => setLogFilter(source)}
                    className={`px-2 py-1 font-mono text-[9px] border transition-all ${
                      logFilter === source
                        ? "bg-[#383E2A]/20 border-[#525D44]/40 text-[#D2E7C9] font-bold"
                        : "bg-[#0A0A0A] border-[#2C2C2A] text-[#8C8C85] hover:text-[#E6E6E0]"
                    }`}
                  >
                    {source.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacious Terminal Viewport */}
            <div className="bg-[#0A0A0A] border border-[#2C2C2A] p-4 font-mono text-xs h-[70vh] flex flex-col justify-between">
              <div className="overflow-y-auto flex-1 space-y-1 select-text scrollbar-thin scrollbar-thumb-neutral-800 pr-2">
                {filteredLogs.length === 0 ? (
                  <div className="text-center text-[#8C8C85]/40 py-20 italic">
                    No log messages found matching current filter scope.
                  </div>
                ) : (
                  filteredLogs.map((l, i) => {
                    const srcColors = {
                      vision: "text-emerald-400",
                      orchestration: "text-sky-400",
                      browser: "text-amber-400",
                      system: "text-red-400",
                    };
                    return (
                      <div key={i} className="leading-relaxed border-b border-[#1C1C1B]/30 pb-1.5 last:border-b-0 break-all flex items-start gap-3">
                        <span className="text-emerald-800 shrink-0">
                          [{new Date(l.ts).toLocaleDateString()} {new Date(l.ts).toLocaleTimeString([], { hour12: false })}]
                        </span>{" "}
                        <span className={`${srcColors[l.source] ?? "text-neutral-500"} shrink-0 font-bold w-24`}>
                          [{l.source.toUpperCase()}]
                        </span>{" "}
                        <span className="text-[#8c8c8c] shrink-0 w-12 font-semibold">
                          [{l.level.toUpperCase()}]
                        </span>{" "}
                        <span className={l.level === "error" ? "text-red-400" : "text-[#C1C1B8] flex-1"}>
                          {l.message}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Terminal Footer */}
              <div className="border-t border-[#1C1C1B] pt-3 mt-3 flex items-center justify-between text-[10px] text-[#8C8C85]">
                <span>TTY CONSOLE ONLINE</span>
                <span>BAUD: 115200</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: DEDICATED TOKEN METRICS & ANALYTICS VIEW */}
        {activeTab === "usage" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header banner */}
            <div className="bg-[#171716] border border-[#2C2C2A] p-4 rounded-none">
              <h2 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">
                LLM Telemetry & Cost Accounting
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono mt-1">
                Real-time API payload measurement and active price schedule analysis
              </p>
            </div>

            {/* Metrics Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              
              {/* Cost card */}
              <div className="bg-[#171716] border border-[#2C2C2A] p-4 flex flex-col justify-between h-32 rounded-none">
                <div className="text-[10px] font-mono text-[#8C8C85] uppercase tracking-wider">Est. Session Cost</div>
                <div className="text-[#10B981] font-mono font-bold text-2xl tracking-tight">
                  ${usage.costUSD.toFixed(5)}
                </div>
                <div className="text-[8px] font-mono text-[#8C8C85]/60">
                  Updated dynamically per API request
                </div>
              </div>

              {/* Tokens volume card */}
              <div className="bg-[#171716] border border-[#2C2C2A] p-4 flex flex-col justify-between h-32 rounded-none">
                <div className="text-[10px] font-mono text-[#8C8C85] uppercase tracking-wider">Total Volume</div>
                <div className="text-[#E6E6E0] font-mono font-bold text-2xl tracking-tight">
                  {usage.totalTokens.toLocaleString()} <span className="text-xs text-[#8C8C85]">Tokens</span>
                </div>
                {/* Visual percentage representation */}
                <div className="space-y-1">
                  <div className="w-full bg-[#0A0A0A] h-1.5 border border-[#2C2C2A]">
                    <div 
                      className="bg-[#10B981] h-full" 
                      style={{ width: `${usage.totalTokens ? (usage.promptTokens / usage.totalTokens) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[8px] font-mono text-[#8C8C85]/60">
                    <span>Prompt: {usage.totalTokens ? Math.round((usage.promptTokens / usage.totalTokens) * 100) : 0}%</span>
                    <span>Completion: {usage.totalTokens ? Math.round((usage.completionTokens / usage.totalTokens) * 100) : 0}%</span>
                  </div>
                </div>
              </div>

              {/* Call counts card */}
              <div className="bg-[#171716] border border-[#2C2C2A] p-4 flex flex-col justify-between h-32 rounded-none">
                <div className="text-[10px] font-mono text-[#8C8C85] uppercase tracking-wider">API Invocations</div>
                <div className="text-[#E6E6E0] font-mono font-bold text-2xl tracking-tight">
                  {usage.callsCount} <span className="text-xs text-[#8C8C85]">Calls</span>
                </div>
                <div className="text-[8px] font-mono text-[#8C8C85]/60">
                  Avg. Tokens/Call: {usage.callsCount ? Math.round(usage.totalTokens / usage.callsCount).toLocaleString() : 0}
                </div>
              </div>

              {/* Active model card — derives from real /api/orchestrate responses */}
              <div className="bg-[#171716] border border-[#2C2C2A] p-4 flex flex-col justify-between h-32 rounded-none">
                <div className="text-[10px] font-mono text-[#8C8C85] uppercase tracking-wider">Routing model</div>
                <div className="text-[#E6E6E0] font-mono text-xs leading-relaxed">
                  <div className="text-emerald-400 font-bold">{usage.model}</div>
                  <div className="text-[#8C8C85] text-[10px] mt-1">
                    {orchestrationMode === "claude"
                      ? "ANTHROPIC_API_KEY detected → real Claude calls"
                      : "no API key → using deterministic mock router"}
                  </div>
                </div>
                <div className="text-[8px] font-mono text-[#8C8C85]/60 uppercase">
                  {orchestrationMode === "claude" ? "Sonnet 4.6 · $3/MTok in · $15/MTok out" : "free · no API calls"}
                </div>
              </div>

            </div>

            {/* Recent orchestration activity */}
            <div className="bg-[#171716] border border-[#2C2C2A] p-4 rounded-none">
              <header className="mb-4 border-b border-[#2C2C2A]/60 pb-2 flex items-center justify-between">
                <h3 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">Recent orchestration calls</h3>
                <span className="text-[9px] text-neutral-500 font-mono">
                  Token counts only populate when a real Claude call is made (ANTHROPIC_API_KEY set).
                </span>
              </header>

              <div className="overflow-x-auto">
                {orchestrationCalls.length === 0 ? (
                  <p className="py-8 text-center text-[#8C8C85]/60 italic font-mono text-xs">
                    No orchestration calls in this session yet. Trigger an event in the Workbench.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {orchestrationCalls.slice().reverse().slice(0, 20).map((call) => (
                      <li key={call.id} className="flex items-start gap-3 py-1.5 px-2 border-b border-[#2C2C2A]/40">
                        <span className="text-[10px] text-neutral-500 mt-0.5 shrink-0 font-mono w-20">
                          {new Date(call.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>
                        <span className="text-xs text-[#E6E6E0] flex-1">{call.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: SETTINGS (integrations, inbox source, security alerts) */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#171716] border border-[#2C2C2A] p-4 rounded-none">
              <h2 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">Settings</h2>
              <p className="text-[11px] text-[#8C8C85] font-mono mt-1">Inbox source, integrations, and security alert thresholds.</p>
            </div>
            <SettingsPanel />
            <SecurityAlertsPanel
              config={crimeConfig}
              onChange={setCrimeConfig}
              animalConfig={animalConfig}
              onAnimalChange={setAnimalConfig}
            />
          </div>
        )}

      </main>
    </div>
  );
}

function Panel({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="border border-[#2C2C2A] bg-[#171716] p-4 rounded-none">
      <header className="flex items-center justify-between mb-3 border-b border-[#2C2C2A]/60 pb-2">
        <h2 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">{title}</h2>
        {badge && (
          <span className="px-2 py-0.5 text-[9px] font-mono tracking-wide bg-[#0A0A0A] border border-[#2C2C2A] text-[#10B981] uppercase rounded-none">
            {badge}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-mono text-[#8C8C85]/80 leading-relaxed italic">{children}</p>;
}

function CurrentActivityCard({
  lastEvent,
  decision,
  result,
  orchestrationMode,
}: {
  lastEvent: CameraEvent;
  decision: ReturnType<typeof useAgentStore.getState>["decision"];
  result: ReturnType<typeof useAgentStore.getState>["result"];
  orchestrationMode: string;
}) {
  return (
    <div className="space-y-3">
      {/* Step 1 — vision saw */}
      <div className="flex items-start gap-2.5">
        <span className="text-xl leading-none mt-0.5">{eventEmoji(lastEvent.event_type)}</span>
        <div className="min-w-0">
          <div className="text-sm text-neutral-100 font-medium">{eventTitle(lastEvent.event_type)}</div>
          <div className="text-[11px] text-neutral-400">{eventDescription(lastEvent)}</div>
          <div className="text-[10px] text-neutral-500 mt-0.5 font-mono">
            {new Date(lastEvent.timestamp).toLocaleTimeString()} ·{" "}
            {confidenceQual(lastEvent.confidence)} confidence ({confidencePercent(lastEvent.confidence)})
          </div>
        </div>
      </div>

      {lastEvent.evidence_clip?.url?.startsWith("blob:") && (
        <video src={lastEvent.evidence_clip.url} controls className="w-full max-w-md rounded-none border border-[#2C2C2A] bg-black" />
      )}

      {/* Step 2 — Peep decided */}
      {decision && (
        <div className="border-l-2 border-sky-700/60 pl-3 py-1">
          <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-mono">
            Peep decided {orchestrationMode === "claude" ? "(via Claude)" : orchestrationMode === "mock" ? "(via rules)" : ""}
          </div>
          <div className="text-xs text-neutral-200">{decisionSentence(decision)}</div>
        </div>
      )}

      {/* Step 3 — Peep did */}
      {result && (
        <div className={`border-l-2 pl-3 py-1 ${result.success ? "border-emerald-700/60" : "border-red-700/60"}`}>
          <div className="text-[10px] uppercase tracking-wide text-neutral-500 font-mono">Peep did</div>
          <div className={`text-xs ${result.success ? "text-emerald-300" : "text-red-300"}`}>
            {result.success ? "✓ " : "✗ "}
            {resultSentence(result)}
          </div>
          {result.receipt_id && result.success && (
            <div className="text-[10px] text-neutral-400 mt-0.5 font-mono">
              Reference: <code className="text-neutral-200">{formatReceiptId(result.receipt_id)}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PipelineGraph({ status }: { status: string }) {
  const steps = [
    { id: "watching", label: "1. WATCHING" },
    { id: "event_detected", label: "2. EVENT TRIGGER" },
    { id: "orchestrating", label: "3. CLAUDE ORCHESTRATION" },
    { id: "acting", label: "4. BROWSER WORKFLOW" },
    { id: "done", label: "5. COMPLETE" },
  ];
  const order = ["watching", "event_detected", "orchestrating", "acting", "done"];
  const activeIdx = order.indexOf(status);
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-[10px]">
      {steps.map((s, i) => {
        const isCurrent = s.id === status;
        const reached = i <= activeIdx;
        
        return (
          <div
            key={s.id}
            className={`border p-2.5 flex flex-col justify-between transition-all rounded-none ${
              isCurrent
                ? "bg-emerald-950/20 border-[#10B981] text-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                : reached
                ? "bg-[#0A0A0A] border-[#2C2C2A] text-emerald-500/70"
                : "bg-[#0A0A0A] border-[#2C2C2A]/40 text-[#5C5C59]"
            }`}
          >
            <div className="font-semibold tracking-wider">{s.label}</div>
            <div className="mt-2 text-[9px] text-right">
              {isCurrent ? "ACTIVE" : reached ? "RESOLVED" : "QUEUED"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
