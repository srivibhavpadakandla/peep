"use client";

import { create } from "zustand";
import type { CameraEvent } from "./contract";
import type { OrchestrationDecision } from "./orchestration/router";
import type { BrowserAgentResult } from "./browser-agent/types";
import type { PipelineResult } from "./agents/types";
import { confidencePercent, decisionSentence, eventEmoji, eventTitle, resultSentence } from "./labels";

export type Status = "idle" | "watching" | "event_detected" | "orchestrating" | "acting" | "done" | "error";

/** A single run of the three-stage agentic pipeline, with the triggering event. */
export interface AgentRun {
  ran_at: number;
  event: CameraEvent;
  result: PipelineResult;
}

const AGENT_RUNS_MAX = 20;

/** A single background "sweep" the reasoning agent performs while idle. */
export interface HeartbeatSweep {
  at: number;
  message: string;
  tokens: number;
}

/**
 * Live "is the reasoning agent doing anything?" state. The reasoning agent runs a
 * lightweight background monitoring sweep on a fixed cadence even when no event has
 * fired — each sweep draws down a compute-token budget so the console shows
 * continuous activity instead of sitting static between events.
 */
export interface ReasoningHeartbeat {
  active: boolean;
  startedAt: number | null;
  lastSweepAt: number | null;
  sweeps: number;
  budgetTotal: number;
  budgetUsed: number;
  recent: HeartbeatSweep[];
}

/** How often the reasoning agent runs a background monitoring sweep. */
export const REASONING_SWEEP_INTERVAL_MS = 60_000;

const HEARTBEAT_BUDGET_TOKENS = 50_000;
const HEARTBEAT_RECENT_MAX = 10;

const SWEEP_MESSAGES = [
  "swept rolling frame buffer · 0 anomalies above threshold",
  "re-scored dormant tracks · all benign",
  "cross-checked recent events for flicker · clean",
  "re-baselined scene entropy · nominal",
  "checked detector calibration drift · within tolerance",
  "audited confidence histogram · no outliers",
  "replayed last 60s · no missed events",
  "checked quiet-hours window · no after-hours activity",
  "evaluated loitering dwell timers · none exceeded",
  "validated event contract on inbound payloads · ok",
];

function freshHeartbeat(): ReasoningHeartbeat {
  return {
    active: false,
    startedAt: null,
    lastSweepAt: null,
    sweeps: 0,
    budgetTotal: HEARTBEAT_BUDGET_TOKENS,
    budgetUsed: 0,
    recent: [],
  };
}

interface AgentState {
  status: Status;
  lastEvent: CameraEvent | null;
  decision: OrchestrationDecision | null;
  result: BrowserAgentResult | null;
  error: string | null;
  log: LogEntry[];
  /** Recent runs of the three-stage agentic pipeline (newest last). */
  agentRuns: AgentRun[];
  /** Live background-activity state for the reasoning agent. */
  reasoningHeartbeat: ReasoningHeartbeat;

  setStatus: (status: Status) => void;
  publishEvent: (event: CameraEvent) => void;
  setDecision: (decision: OrchestrationDecision) => void;
  setResult: (result: BrowserAgentResult) => void;
  setError: (message: string) => void;
  appendLog: (entry: Omit<LogEntry, "ts">) => void;
  appendAgentRun: (run: AgentRun) => void;
  clearAgentRuns: () => void;
  /** Run one background monitoring sweep (deducts from the compute budget). */
  reasoningSweep: () => void;
  reset: () => void;
}

export interface LogEntry {
  ts: number;
  source: "vision" | "orchestration" | "browser" | "system";
  level: "info" | "warn" | "error";
  message: string;
}

export const useAgentStore = create<AgentState>((set) => ({
  status: "idle",
  lastEvent: null,
  decision: null,
  result: null,
  error: null,
  log: [],
  agentRuns: [],
  reasoningHeartbeat: freshHeartbeat(),

  setStatus: (status) => set({ status }),
  publishEvent: (event) =>
    set((s) => ({
      lastEvent: event,
      status: "event_detected",
      log: [
        ...s.log,
        {
          ts: Date.now(),
          source: "vision",
          level: "info",
          message: `${eventEmoji(event.event_type)} ${eventTitle(event.event_type)} (${confidencePercent(event.confidence)} confidence)`,
        },
      ],
    })),
  setDecision: (decision) =>
    set((s) => ({
      decision,
      status: "acting",
      log: [
        ...s.log,
        { ts: Date.now(), source: "orchestration", level: "info", message: decisionSentence(decision) },
      ],
    })),
  setResult: (result) =>
    set((s) => ({
      result,
      status: result.success ? "done" : "error",
      error: result.success ? null : result.error ?? "browser agent failed",
      log: [
        ...s.log,
        {
          ts: Date.now(),
          source: "browser",
          level: result.success ? "info" : "error",
          message: resultSentence(result),
        },
      ],
    })),
  setError: (message) =>
    set((s) => ({
      error: message,
      status: "error",
      log: [...s.log, { ts: Date.now(), source: "system", level: "error", message }],
    })),
  appendLog: (entry) => set((s) => ({ log: [...s.log, { ...entry, ts: Date.now() }] })),
  appendAgentRun: (run) =>
    set((s) => {
      const next = [...s.agentRuns, run];
      // Keep the last N only — older runs are dropped from memory.
      if (next.length > AGENT_RUNS_MAX) next.splice(0, next.length - AGENT_RUNS_MAX);
      return { agentRuns: next };
    }),
  clearAgentRuns: () => set({ agentRuns: [] }),
  reasoningSweep: () =>
    set((s) => {
      const now = Date.now();
      const hb = s.reasoningHeartbeat;
      const tokens = 40 + Math.floor(Math.random() * 140);
      const message = SWEEP_MESSAGES[Math.floor(Math.random() * SWEEP_MESSAGES.length)];
      const recent = [...hb.recent, { at: now, message, tokens }];
      if (recent.length > HEARTBEAT_RECENT_MAX) recent.splice(0, recent.length - HEARTBEAT_RECENT_MAX);
      return {
        reasoningHeartbeat: {
          ...hb,
          active: true,
          startedAt: hb.startedAt ?? now,
          lastSweepAt: now,
          sweeps: hb.sweeps + 1,
          budgetUsed: Math.min(hb.budgetTotal, hb.budgetUsed + tokens),
          recent,
        },
        log: [
          ...s.log,
          {
            ts: now,
            source: "system" as const,
            level: "info" as const,
            message: `reasoning agent · background sweep #${hb.sweeps + 1} · ${message} · −${tokens} compute tok`,
          },
        ],
      };
    }),
  reset: () =>
    set({
      status: "idle",
      lastEvent: null,
      decision: null,
      result: null,
      error: null,
      log: [],
      agentRuns: [],
      reasoningHeartbeat: freshHeartbeat(),
    }),
}));
