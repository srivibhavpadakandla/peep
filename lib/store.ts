"use client";

import { create } from "zustand";
import type { CameraEvent } from "./contract";
import type { OrchestrationDecision } from "./orchestration/router";
import type { BrowserAgentResult } from "./browser-agent/types";

export type Status = "idle" | "watching" | "event_detected" | "orchestrating" | "acting" | "done" | "error";

interface AgentState {
  status: Status;
  lastEvent: CameraEvent | null;
  decision: OrchestrationDecision | null;
  result: BrowserAgentResult | null;
  error: string | null;
  log: LogEntry[];

  setStatus: (status: Status) => void;
  publishEvent: (event: CameraEvent) => void;
  setDecision: (decision: OrchestrationDecision) => void;
  setResult: (result: BrowserAgentResult) => void;
  setError: (message: string) => void;
  appendLog: (entry: Omit<LogEntry, "ts">) => void;
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

  setStatus: (status) => set({ status }),
  publishEvent: (event) =>
    set((s) => ({
      lastEvent: event,
      status: "event_detected",
      log: [...s.log, { ts: Date.now(), source: "vision", level: "info", message: `event=${event.event_type} conf=${event.confidence.toFixed(2)}` }],
    })),
  setDecision: (decision) =>
    set((s) => ({
      decision,
      status: "acting",
      log: [...s.log, { ts: Date.now(), source: "orchestration", level: "info", message: `workflow=${decision.workflow} reason=${decision.reason}` }],
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
          message: result.success ? `receipt=${result.receipt_id}` : `failed: ${result.error}`,
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
  reset: () =>
    set({ status: "idle", lastEvent: null, decision: null, result: null, error: null, log: [] }),
}));
