import Anthropic from "@anthropic-ai/sdk";
import type { CameraEvent } from "../contract";
import type { OrchestrationDecision, OrchestrationRouter, Workflow } from "./router";

const MODEL = "claude-sonnet-4-6";

const VALID_WORKFLOWS: Workflow[] = ["amazon_refund_claim", "log_incident", "no_action"];

const SYSTEM_PROMPT = `You are the orchestration agent for an autonomous camera system.

You receive a structured camera event from a vision agent. You must decide which
downstream workflow the browser agent should execute. Always reply with a single
JSON object — no prose, no markdown fences — matching:

{
  "workflow": "amazon_refund_claim" | "log_incident" | "no_action",
  "reason": "<one sentence>",
  "params": { ... workflow-specific args ... }
}

Workflow guide:
- "amazon_refund_claim": for both "package_taken" (theft) and "package_not_arrived"
  (the inbox said it should have arrived today but the camera saw nothing). Params:
    order_id (string)
    reason ("package_stolen" for theft, "never_arrived" for missing delivery)
    item_description (string — human-readable summary of the event)
  Only fire this when confidence >= 0.5.
- "log_incident": for "package_arrived" (delivery confirmed) and other low-stakes
  observations. params: { kind: "arrival" | "loitering" }.
- "no_action": clearly benign events. params: {}.

Use defaults when unsure: order_id="112-7350199-0123456". item_description should
restate the event in human terms.`;

export class ClaudeRouter implements OrchestrationRouter {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async decide(event: CameraEvent): Promise<OrchestrationDecision> {
    const userPayload = JSON.stringify(
      {
        event_type: event.event_type,
        timestamp_iso: new Date(event.timestamp).toISOString(),
        confidence: event.confidence,
        evidence_clip: { duration_ms: event.evidence_clip.duration_ms, mime_type: event.evidence_clip.mime_type },
      },
      null,
      2,
    );

    const response = await this.client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPayload }],
    });

    const text = extractText(response);
    return parseDecision(text);
  }
}

function extractText(response: Anthropic.Message): string {
  for (const block of response.content) {
    if (block.type === "text") return block.text;
  }
  throw new Error("Claude returned no text block");
}

export function parseDecision(text: string): OrchestrationDecision {
  const stripped = text.trim().replace(/^```(?:json)?\s*|```$/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch (err) {
    throw new Error(`Claude returned non-JSON output: ${text.slice(0, 200)}`);
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
