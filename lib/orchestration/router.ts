import type { CameraEvent, EventType } from "../contract";

export type Workflow = "amazon_refund_claim" | "log_incident" | "no_action";

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
 * Deterministic fallback used when ANTHROPIC_API_KEY is absent. Lets the demo
 * run offline and keeps the contract testable.
 */
export class MockRouter implements OrchestrationRouter {
  async decide(event: CameraEvent): Promise<OrchestrationDecision> {
    const map: Record<EventType, OrchestrationDecision> = {
      package_taken: {
        workflow: "amazon_refund_claim",
        reason: "Package observed taken from frame; default policy files a refund claim.",
        params: {
          order_id: "112-7350199-0123456",
          item_description: "Package shown on camera at " + new Date(event.timestamp).toISOString(),
          confidence: event.confidence,
        },
      },
      package_arrived: {
        workflow: "log_incident",
        reason: "Arrival event — log only, no action required.",
        params: { kind: "arrival" },
      },
      person_loitering: {
        workflow: "log_incident",
        reason: "Loitering is suspicious but not actionable without policy escalation.",
        params: { kind: "loitering" },
      },
    };
    return map[event.event_type];
  }
}
