import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CameraEvent } from "../contract";
import type { OrchestrationDecision, OrchestrationRouter, Workflow } from "./router";

const MODEL = "gemini-2.5-flash";

const VALID_WORKFLOWS: Workflow[] = [
  "amazon_refund_claim",
  "security_alert",
  "log_incident",
  "no_action",
];

const SYSTEM_PROMPT = `You are the orchestration agent for an autonomous camera system.

You receive a structured camera event from a vision agent. You must decide which
downstream workflow the browser agent should execute. Always reply with a single
JSON object — no prose, no markdown fences — matching:

{
  "workflow": "amazon_refund_claim" | "security_alert" | "log_incident" | "no_action",
  "reason": "<one sentence>",
  "params": { ... workflow-specific args ... }
}

Workflow guide:
- "amazon_refund_claim": for "package_taken" (theft) and "package_not_arrived"
  (inbox expected today, camera saw nothing). Params:
    order_id (string)
    reason ("package_stolen" for theft, "never_arrived" for missing)
    item_description (string)
  Only fire when confidence >= 0.5.
- "security_alert": for any crime / wildlife signal — "person_loitering",
  "multiple_loitering", "weapon_detected", "after_hours_activity", "animal_detected".
  Params:
    event_type (string — pass through the input event_type)
    severity ("info" | "warning" | "high" | "critical")
      - weapons → critical, multi-loitering → high, bear → high, dog/cat/bird → info, others → warning
    confidence (number)
    animal (string, only for animal_detected — e.g. "dog", "bear")
- "log_incident": for "package_arrived" (delivery confirmed) — log only.
  params: { kind: "arrival" }.
- "no_action": clearly benign events. params: {}.

Use defaults when unsure: order_id="112-7350199-0123456". item_description should
restate the event in human terms.`;

export class GeminiRouter implements OrchestrationRouter {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async decide(event: CameraEvent): Promise<OrchestrationDecision> {
    const userPayload = JSON.stringify(
      {
        event_type: event.event_type,
        timestamp_iso: new Date(event.timestamp).toISOString(),
        confidence: event.confidence,
        evidence_clip: {
          duration_ms: event.evidence_clip.duration_ms,
          mime_type: event.evidence_clip.mime_type,
        },
      },
      null,
      2,
    );

    const model = this.client.getGenerativeModel({
      model: MODEL,
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        // Request strict JSON so we don't have to strip prose/markdown fences.
        responseMimeType: "application/json",
        temperature: 0,
      },
    });

    const result = await model.generateContent(userPayload);
    const text = result.response.text();
    return parseDecision(text);
  }
}

export function parseDecision(text: string): OrchestrationDecision {
  // Even with responseMimeType: "application/json", be defensive about fences.
  const stripped = text.trim().replace(/^```(?:json)?\s*|```$/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new Error(`Gemini returned non-JSON output: ${text.slice(0, 200)}`);
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Decision must be an object");
  const obj = parsed as Record<string, unknown>;
  if (typeof obj.workflow !== "string" || !VALID_WORKFLOWS.includes(obj.workflow as Workflow)) {
    throw new Error(`Invalid workflow: ${obj.workflow}`);
  }
  if (typeof obj.reason !== "string") throw new Error("Decision.reason missing");
  if (!obj.params || typeof obj.params !== "object") throw new Error("Decision.params missing");
  return {
    workflow: obj.workflow as Workflow,
    reason: obj.reason,
    params: obj.params as Record<string, string | number | boolean>,
  };
}
