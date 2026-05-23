import type { CameraEvent } from "../contract";

/**
 * Strict contracts for the three-stage agentic pipeline.
 * Each stage outputs ONE of these shapes — no prose, no markdown, no extras.
 */

export type Workflow =
  | "send_security_email"
  | "amazon_refund_claim"
  | "log_incident"
  | "no_action";

export interface OrchestratorDecision {
  /** "reason" to advance, "skip" to drop the event entirely. */
  next: "reason" | "skip";
  workflow: Workflow;
  reason: string;
}

export interface ReasoningVerdict {
  verdict: "real" | "false_positive";
  /** Confidence as received from the event (echoed for the audit trail). */
  confidence: number;
  /** Why we reached this verdict — cites the failing rule if false_positive. */
  rationale: string;
  /**
   * One-line summary suitable for the email subject (executor truncates to 78).
   * Empty string when verdict is false_positive.
   */
  alert_summary: string;
}

export interface ExecutorResult {
  success: boolean;
  workflow: Workflow;
  /** Gmail messageId when an email was sent. */
  message_id?: string;
  /** ISO8601 timestamp when the side effect happened. */
  sent_at?: string;
  /** Populated when success === false. */
  error?: string;
}

/** Full pipeline trace returned to the UI. */
export interface PipelineResult {
  orchestrator: OrchestratorDecision;
  reasoning?: ReasoningVerdict;
  executor?: ExecutorResult;
  /** Useful flag for UI: did we actually send a Gmail? */
  email_sent: boolean;
}

export interface PipelineRequest {
  event: CameraEvent;
  /** Recent events (caller-supplied) for flicker detection. */
  history: CameraEvent[];
  /** Loitering dwell threshold in ms; default 5000. */
  loiteringThresholdMs?: number;
}

/** Safe-fail outputs for malformed input at each stage. */
export const SAFE_FAIL = {
  orchestrator: (reason: string): OrchestratorDecision => ({
    next: "skip",
    workflow: "no_action",
    reason,
  }),
  reasoning: (rationale: string): ReasoningVerdict => ({
    verdict: "false_positive",
    confidence: 0,
    rationale,
    alert_summary: "",
  }),
  executor: (workflow: Workflow, error: string): ExecutorResult => ({
    success: false,
    workflow,
    error,
  }),
};
