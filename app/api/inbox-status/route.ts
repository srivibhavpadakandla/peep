import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, isGoogleConfigured, GMAIL_SCOPE } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const configured = isGoogleConfigured();
  const session = configured ? await getServerSession(authOptions) : null;
  const scope = (session as { scope?: string } | null)?.scope ?? "";
  const connected = Boolean((session as { accessToken?: string } | null)?.accessToken && scope.includes(GMAIL_SCOPE));
  return NextResponse.json({
    configured,
    connected,
    email: session?.user?.email ?? null,
    source: connected ? "gmail" : "seed",
  });
}
