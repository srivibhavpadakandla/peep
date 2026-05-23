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

interface AgentState {
  status: Status;
  lastEvent: CameraEvent | null;
  decision: OrchestrationDecision | null;
  result: BrowserAgentResult | null;
  error: string | null;
  log: LogEntry[];
  /** Recent runs of the three-stage agentic pipeline (newest last). */
  agentRuns: AgentRun[];

  setStatus: (status: Status) => void;
  publishEvent: (event: CameraEvent) => void;
  setDecision: (decision: OrchestrationDecision) => void;
  setResult: (result: BrowserAgentResult) => void;
  setError: (message: string) => void;
  appendLog: (entry: Omit<LogEntry, "ts">) => void;
  appendAgentRun: (run: AgentRun) => void;
  clearAgentRuns: () => void;
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
  reset: () =>
    set({
      status: "idle",
      lastEvent: null,
      decision: null,
      result: null,
      error: null,
      log: [],
      agentRuns: [],
    }),
}));
