import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, GMAIL_SEND_SCOPE } from "@/lib/auth";
import { orchestrate } from "@/lib/agents/orchestrator";
import { reason } from "@/lib/agents/reasoning";
import { execute } from "@/lib/agents/executor";
import type { PipelineRequest, PipelineResult } from "@/lib/agents/types";
import { isCameraEvent } from "@/lib/contract";

export const runtime = "nodejs";

/**
 * Three-stage agentic pipeline:
 *   orchestrator → reasoning → executor
 *
 * Each stage's strict JSON output is included in the response so the UI can
 * render the full audit trail. Stages short-circuit cleanly:
 *   - orchestrator.next === "skip"           → no reasoning, no executor
 *   - reasoning.verdict === "false_positive" → no executor
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const t0 = performance.now();
  const req = body as Partial<PipelineRequest> | null;
  if (!req || typeof req !== "object" || !isCameraEvent(req.event)) {
    // Safe-fail at stage 1 — return the orchestrator's safe-fail shape rather
    // than a refusal, per spec.
    const tA = performance.now();
    const orchestratorOutput = orchestrate(req?.event);
    const orchestrator_ms = Math.round(performance.now() - tA);
    const result: PipelineResult = {
      orchestrator: orchestratorOutput,
      email_sent: false,
      timings: { orchestrator_ms, total_ms: Math.round(performance.now() - t0) },
    };
    return NextResponse.json(result);
  }

  const tA = performance.now();
  const orchestratorOutput = orchestrate(req.event);
  const orchestrator_ms = Math.round(performance.now() - tA);

  if (orchestratorOutput.next === "skip") {
    const result: PipelineResult = {
      orchestrator: orchestratorOutput,
      email_sent: false,
      timings: { orchestrator_ms, total_ms: Math.round(performance.now() - t0) },
    };
    return NextResponse.json(result);
  }

  const tB = performance.now();
  const history = Array.isArray(req.history) ? req.history.filter(isCameraEvent) : [];
  const reasoningOutput = reason(req.event, history, {
    loiteringThresholdMs: req.loiteringThresholdMs ?? 5000,
  });
  const reasoning_ms = Math.round(performance.now() - tB);

  // Don't even attempt execution on a false positive.
  if (reasoningOutput.verdict === "false_positive") {
    const result: PipelineResult = {
      orchestrator: orchestratorOutput,
      reasoning: reasoningOutput,
      email_sent: false,
      timings: { orchestrator_ms, reasoning_ms, total_ms: Math.round(performance.now() - t0) },
    };
    return NextResponse.json(result);
  }

  // Stage 3 — execution. For send_security_email we need the user's Gmail token.
  const session = await getServerSession(authOptions);
  const accessToken = (session as { accessToken?: string } | null)?.accessToken ?? null;
  const scope = (session as { scope?: string } | null)?.scope ?? "";
  const hasSendScope = scope.includes(GMAIL_SEND_SCOPE);
  const sendToken =
    orchestratorOutput.workflow === "send_security_email" && hasSendScope ? accessToken : null;

  const tC = performance.now();
  const executorOutput = await execute({
    workflow: orchestratorOutput.workflow,
    decision: orchestratorOutput,
    verdict: reasoningOutput,
    event: req.event,
    accessToken: sendToken,
  });
  const executor_ms = Math.round(performance.now() - tC);

  const result: PipelineResult = {
    orchestrator: orchestratorOutput,
    reasoning: reasoningOutput,
    executor: executorOutput,
    email_sent: Boolean(executorOutput.success && executorOutput.message_id),
    timings: {
      orchestrator_ms,
      reasoning_ms,
      executor_ms,
      total_ms: Math.round(performance.now() - t0),
    },
  };

  return NextResponse.json(result);
}
