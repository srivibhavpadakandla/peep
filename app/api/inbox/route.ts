import { NextResponse } from "next/server";
import { seedInbox } from "@/lib/inbox/seed";
import { parseExpectedDeliveries } from "@/lib/inbox/parser";

export const runtime = "nodejs";

export async function GET() {
  const now = new Date();
  const emails = seedInbox(now);
  const today = isoDate(now);
  const expected = parseExpectedDeliveries(emails, today);
  return NextResponse.json({ today, emails, expected });
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
