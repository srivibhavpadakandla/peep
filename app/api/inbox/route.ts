import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { seedInbox } from "@/lib/inbox/seed";
import { parseExpectedDeliveries } from "@/lib/inbox/parser";
import { fetchGmailInbox } from "@/lib/inbox/gmail";
import { authOptions, isGoogleConfigured, GMAIL_SCOPE } from "@/lib/auth";
import type { InboxEmail } from "@/lib/inbox/types";

export const runtime = "nodejs";

export async function GET() {
  const now = new Date();
  const today = isoDate(now);

  const { emails, source } = await loadEmails(now);
  const expected = parseExpectedDeliveries(emails, today);

  return NextResponse.json({ today, emails, expected, source });
}

async function loadEmails(now: Date): Promise<{ emails: InboxEmail[]; source: "gmail" | "seed" }> {
  if (isGoogleConfigured()) {
    const session = await getServerSession(authOptions);
    const accessToken = (session as { accessToken?: string } | null)?.accessToken;
    const scope = (session as { scope?: string } | null)?.scope ?? "";
    if (accessToken && scope.includes(GMAIL_SCOPE)) {
      try {
        return { emails: await fetchGmailInbox(accessToken), source: "gmail" };
      } catch (err) {
        console.error("Gmail fetch failed, falling back to seed:", err);
      }
    }
  }
  return { emails: seedInbox(now), source: "seed" };
}

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
