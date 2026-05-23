import { NextResponse } from "next/server";
import { isCameraEvent } from "@/lib/contract";
import { getOrchestrationRouter } from "@/lib/orchestration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!isCameraEvent(body)) {
    return NextResponse.json({ error: "payload does not match the event contract" }, { status: 400 });
  }

  const { router, mode } = getOrchestrationRouter();
  try {
    const decision = await router.decide(body);
    return NextResponse.json({ ...decision, _mode: mode });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
