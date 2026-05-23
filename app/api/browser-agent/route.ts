import { NextResponse } from "next/server";
import { runBrowserAgent } from "@/lib/browser-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "missing body" }, { status: 400 });
  }

  const obj = body as Record<string, unknown>;
  if (typeof obj.workflow !== "string" || typeof obj.params !== "object" || !obj.params) {
    return NextResponse.json({ error: "expected { workflow, params }" }, { status: 400 });
  }

  try {
    const result = await runBrowserAgent({
      workflow: obj.workflow,
      params: obj.params as Record<string, string | number | boolean>,
      baseUrl: typeof obj.baseUrl === "string" ? obj.baseUrl : undefined,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
