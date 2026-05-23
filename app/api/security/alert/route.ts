import { NextResponse } from "next/server";
import { alertStore } from "@/lib/security/alerts";
import type { EventType } from "@/lib/contract";

export const runtime = "nodejs";

const CRIME_EVENTS: EventType[] = [
  "person_loitering",
  "multiple_loitering",
  "weapon_detected",
  "after_hours_activity",
];

export async function GET() {
  return NextResponse.json({ alerts: alertStore.list() });
}

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
  const eventType = obj.event_type as EventType | undefined;
  if (!eventType || !CRIME_EVENTS.includes(eventType)) {
    return NextResponse.json({ error: `event_type must be one of ${CRIME_EVENTS.join(", ")}` }, { status: 400 });
  }
  const confidence = typeof obj.confidence === "number" ? obj.confidence : 0;
  const meta = obj.meta && typeof obj.meta === "object" ? (obj.meta as Record<string, unknown>) : undefined;
  const ts = typeof obj.ts === "number" ? obj.ts : undefined;
  const alert = alertStore.append({ event_type: eventType, confidence, meta, ts });
  return NextResponse.json({ alert });
}

export async function DELETE() {
  alertStore.clear();
  return NextResponse.json({ ok: true });
}
