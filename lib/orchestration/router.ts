import type { CameraEvent, EventType } from "../contract";

export type Workflow = "amazon_refund_claim" | "security_alert" | "log_incident" | "no_action";

export interface OrchestrationDecision {
  workflow: Workflow;
  reason: string;
  /** Parameters passed verbatim into the browser agent for the chosen workflow. */
  params: Record<string, string | number | boolean>;
}

export interface OrchestrationRouter {
  decide(event: CameraEvent): Promise<OrchestrationDecision>;
}

/**
 * Deterministic fallback used when GEMINI_API_KEY is absent. Lets the demo
 * run offline and keeps the contract testable.
 */
export class MockRouter implements OrchestrationRouter {
  async decide(event: CameraEvent): Promise<OrchestrationDecision> {
    const orderId = String((event as unknown as { order_id?: string }).order_id ?? "112-7350199-0123456");
    const map: Record<EventType, OrchestrationDecision> = {
      package_taken: {
        workflow: "amazon_refund_claim",
        reason: "Package observed taken from frame by a person; filing a stolen-package refund claim.",
        params: {
          order_id: orderId,
          reason: "package_stolen",
          item_description: "Package taken from the doorstep — captured on camera at " + new Date(event.timestamp).toISOString(),
          confidence: event.confidence,
        },
      },
      package_arrived: {
        workflow: "log_incident",
        reason: "Arrival event — log only, no action required.",
        params: { kind: "arrival" },
      },
      package_not_arrived: {
        workflow: "amazon_refund_claim",
        reason: "Inbox said package was expected today but camera observed no delivery; filing a never-arrived claim.",
        params: {
          order_id: orderId,
          reason: "never_arrived",
          item_description:
            "Order showed as expected by " + new Date(event.timestamp).toISOString() + " but no delivery was observed on camera.",
          confidence: event.confidence,
        },
      },
      person_loitering: {
        workflow: "security_alert",
        reason: "Person loitering near the doorstep without interacting with the package.",
        params: {
          event_type: "person_loitering",
          severity: "warning",
          confidence: event.confidence,
        },
      },
      multiple_loitering: {
        workflow: "security_alert",
        reason: "Multiple people loitering together — escalated severity.",
        params: {
          event_type: "multiple_loitering",
          severity: "high",
          confidence: event.confidence,
        },
      },
      weapon_detected: {
        workflow: "security_alert",
        reason: "A weapon was visible on camera. Highest severity.",
        params: {
          event_type: "weapon_detected",
          severity: "critical",
          confidence: event.confidence,
        },
      },
      after_hours_activity: {
        workflow: "security_alert",
        reason: "Person detected during quiet hours.",
        params: {
          event_type: "after_hours_activity",
          severity: "warning",
          confidence: event.confidence,
        },
      },
      animal_detected: {
        workflow: "security_alert",
        reason: `Animal detected on camera (${
          (event as unknown as { animal?: string }).animal ?? "unknown"
        }).`,
        params: {
          event_type: "animal_detected",
          severity: (event as unknown as { severity?: string }).severity ?? "info",
          animal: (event as unknown as { animal?: string }).animal ?? "unknown",
          confidence: event.confidence,
        },
      },
    };
    return map[event.event_type];
  }
}
