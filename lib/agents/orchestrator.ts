import type { CameraEvent } from "../contract";
import { isCameraEvent } from "../contract";
import type { OrchestratorDecision } from "./types";
import { SAFE_FAIL } from "./types";

/**
 * Stage 1 — Orchestrator. Pure. Routes a CameraEvent to a workflow or drops it.
 *
 * Rules:
 *   - confidence < 0.5            → skip (no_action)
 *   - malformed input             → safe-fail no_action
 *   - person_loitering            → send_security_email
 *   - multiple_loitering          → send_security_email
 *   - after_hours_activity        → send_security_email
 *   - weapon_detected             → send_security_email
 *   - package_taken               → amazon_refund_claim
 *   - package_not_arrived         → amazon_refund_claim
 *   - package_arrived             → log_incident
 *   - animal_detected             → log_incident
 *   - any other valid event_type  → log_incident
 */
export function orchestrate(event: unknown): OrchestratorDecision {
  if (!isCameraEvent(event)) {
    return SAFE_FAIL.orchestrator("event does not match the CameraEvent contract");
  }

  if (event.confidence < 0.5) {
    return {
      next: "skip",
      workflow: "no_action",
      reason: `confidence ${event.confidence.toFixed(2)} below 0.5 threshold`,
    };
  }

  switch (event.event_type) {
    case "person_loitering":
    case "multiple_loitering":
      return { next: "reason", workflow: "send_security_email", reason: "loitering detected" };
    case "after_hours_activity":
      return { next: "reason", workflow: "send_security_email", reason: "after-hours activity" };
    case "weapon_detected":
      return { next: "reason", workflow: "send_security_email", reason: "weapon detected" };
    case "package_taken":
      return { next: "reason", workflow: "amazon_refund_claim", reason: "package theft" };
    case "package_not_arrived":
      return { next: "reason", workflow: "amazon_refund_claim", reason: "expected delivery missing" };
    case "package_arrived":
      return { next: "reason", workflow: "log_incident", reason: "package delivered" };
    case "animal_detected":
      return { next: "reason", workflow: "log_incident", reason: "animal observed" };
    default:
      return { next: "reason", workflow: "log_incident", reason: "no specific action" };
  }
}
