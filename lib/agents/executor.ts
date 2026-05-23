import type { CameraEvent } from "../contract";
import type { ExecutorResult, OrchestratorDecision, ReasoningVerdict, Workflow } from "./types";
import { SAFE_FAIL } from "./types";
import { sendGmailAlert } from "./gmail-send";

/**
 * Stage 3 — Executor. Carries out exactly one side-effecting tool call to
 * fulfill the orchestrator's chosen workflow, but only when the reasoning
 * stage already verified the event as REAL. If verdict === false_positive,
 * the executor skips entirely and reports no_action.
 *
 * Workflows handled:
 *   - send_security_email → gmail.users.messages.send via the user's session
 *   - amazon_refund_claim → no-op here; existing /api/browser-agent owns this
 *   - log_incident, no_action → no side effect
 *
 * Constraints (from the agent spec):
 *   - exactly one tool call per execution
 *   - no chaining, no retries, no re-judging the orchestrator's decision
 *   - never invents recipients; always reads PEEP_ALERT_RECIPIENT
 */
export async function execute({
  workflow,
  decision,
  verdict,
  event,
  accessToken,
}: {
  workflow: Workflow;
  decision: OrchestratorDecision;
  verdict: ReasoningVerdict;
  event: CameraEvent;
  accessToken: string | null;
}): Promise<ExecutorResult> {
  if (verdict.verdict === "false_positive") {
    return {
      success: true,
      workflow: "no_action",
      error: `skipped: ${verdict.rationale}`,
    };
  }

  if (decision.next === "skip") {
    return { success: true, workflow: "no_action" };
  }

  switch (workflow) {
    case "send_security_email": {
      if (!accessToken) {
        return SAFE_FAIL.executor(workflow, "no Gmail access token in session — connect Gmail in Settings");
      }
      try {
        const { message_id, sent_at } = await sendGmailAlert({ accessToken, event, verdict });
        return { success: true, workflow, message_id, sent_at };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return SAFE_FAIL.executor(workflow, message);
      }
    }
    case "amazon_refund_claim":
      // Delegated to the existing browser agent; nothing for this executor to do.
      return { success: true, workflow };
    case "log_incident":
    case "no_action":
      return { success: true, workflow };
  }
}
