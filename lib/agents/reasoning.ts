import type { CameraEvent } from "../contract";
import type { ReasoningVerdict } from "./types";
import { SAFE_FAIL } from "./types";
import { eventTitle } from "../labels";

const FLICKER_WINDOW_MS = 30_000;
const REAL_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Stage 2 — Reasoning. Pure. Treats the event as a hypothesis to verify
 * against its metadata and a recent-history list.
 *
 * REAL requires ALL of:
 *   1. confidence >= 0.7
 *   2. (for loitering events) dwell_ms meets the configured threshold
 *   3. no flicker: no other matching event in the last FLICKER_WINDOW_MS
 *
 * Otherwise: FALSE_POSITIVE with the first failing rule cited.
 */
export function reason(
  event: CameraEvent,
  history: CameraEvent[],
  options: { loiteringThresholdMs: number } = { loiteringThresholdMs: 5000 },
): ReasoningVerdict {
  const failing: string[] = [];

  if (event.confidence < REAL_CONFIDENCE_THRESHOLD) {
    failing.push(
      `confidence ${event.confidence.toFixed(2)} below ${REAL_CONFIDENCE_THRESHOLD} threshold`,
    );
  }

  const dwellMs = (event as unknown as { dwell_ms?: number }).dwell_ms;
  const requiresDwell =
    event.event_type === "person_loitering" || event.event_type === "multiple_loitering";
  if (requiresDwell && typeof dwellMs === "number" && dwellMs < options.loiteringThresholdMs) {
    failing.push(
      `dwell ${dwellMs}ms below ${options.loiteringThresholdMs}ms loitering threshold`,
    );
  }

  const flicker = history.some(
    (h) =>
      h.event_type === event.event_type &&
      h.timestamp !== event.timestamp &&
      Math.abs(event.timestamp - h.timestamp) < FLICKER_WINDOW_MS,
  );
  if (flicker) {
    failing.push(`flicker: matching ${event.event_type} within last 30s`);
  }

  if (failing.length > 0) {
    return {
      verdict: "false_positive",
      confidence: round2(event.confidence),
      rationale: failing.join("; "),
      alert_summary: "",
    };
  }

  const dwellSec = typeof dwellMs === "number" ? `${Math.round(dwellMs / 1000)}s` : null;
  const rationale =
    `confidence ${event.confidence.toFixed(2)}` +
    (dwellSec ? ` · dwelled ${dwellSec} above ${Math.round(options.loiteringThresholdMs / 1000)}s threshold` : "") +
    " · no recent flicker";

  const summary = buildAlertSummary(event, dwellMs);

  return {
    verdict: "real",
    confidence: round2(event.confidence),
    rationale,
    alert_summary: summary,
  };
}

/** Used to validate a verdict produced elsewhere (safe-fail on malformed input). */
export function safeReason(
  event: unknown,
  history: unknown,
  options?: { loiteringThresholdMs: number },
): ReasoningVerdict {
  if (!event || typeof event !== "object") return SAFE_FAIL.reasoning("event payload missing");
  if (!Array.isArray(history)) return SAFE_FAIL.reasoning("history must be an array");
  return reason(event as CameraEvent, history as CameraEvent[], options);
}

function buildAlertSummary(event: CameraEvent, dwellMs: number | undefined): string {
  const dwellSuffix = dwellMs ? ` for ${Math.round(dwellMs / 1000)}s` : "";
  switch (event.event_type) {
    case "person_loitering":
      return `Person loitering at front door${dwellSuffix}`;
    case "multiple_loitering":
      return `Multiple people loitering at front door${dwellSuffix}`;
    case "after_hours_activity":
      return "After-hours activity at front door";
    case "weapon_detected":
      return "Weapon spotted at front door";
    case "package_taken":
      return "Package taken from front door";
    case "package_not_arrived":
      return "Expected package didn't arrive";
    case "package_arrived":
      return "Package delivered";
    case "animal_detected":
      return "Animal spotted at front door";
    default:
      return eventTitle(event.event_type);
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
