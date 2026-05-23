import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

/**
 * Dev-only setup helper. Accepts a Google OAuth Client ID + Secret from the
 * Settings panel, writes them into the project's .env.local, generates a
 * NEXTAUTH_SECRET if missing, and sets NEXTAUTH_URL.
 *
 * This endpoint mutates a file on disk. It is gated on NODE_ENV === "development"
 * so it cannot be used in any deployed environment.
 */

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Setup is only available in development." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "expected { client_id, client_secret }" }, { status: 400 });
  }

  const obj = body as Record<string, unknown>;
  const clientId = typeof obj.client_id === "string" ? obj.client_id.trim() : "";
  const clientSecret = typeof obj.client_secret === "string" ? obj.client_secret.trim() : "";
  const providedOrigin = typeof obj.origin === "string" ? obj.origin.trim() : "";

  if (!clientId || !clientSecret) {
    return NextResponse.json({ error: "client_id and client_secret are required" }, { status: 400 });
  }
  if (!/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(clientId)) {
    return NextResponse.json({
      error: "client_id doesn't look like a Google OAuth client. Should end in .apps.googleusercontent.com",
    }, { status: 400 });
  }

  // Derive the actual app origin so NEXTAUTH_URL matches the port the user is on.
  // Priority: explicit origin in body → request Origin header → host header → fallback 3000.
  let nextAuthUrl = providedOrigin;
  if (!nextAuthUrl) {
    const originHeader = request.headers.get("origin");
    if (originHeader) nextAuthUrl = originHeader;
  }
  if (!nextAuthUrl) {
    const host = request.headers.get("host");
    if (host) nextAuthUrl = `http://${host}`;
  }
  if (!nextAuthUrl) nextAuthUrl = "http://localhost:3000";

  const envPath = path.join(process.cwd(), ".env.local");
  let existing = "";
  try {
    existing = await fs.readFile(envPath, "utf-8");
  } catch {
    // file doesn't exist yet; we'll create it
  }

  // Always overwrite NEXTAUTH_URL — a stale 3000 here is the #1 cause of OAuth
  // redirects landing on a dead port after the user switches workspaces.
  const updates: Record<string, string> = {
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
    NEXTAUTH_URL: nextAuthUrl,
  };

  if (!readEnvValue(existing, "NEXTAUTH_SECRET")) {
    updates.NEXTAUTH_SECRET = crypto.randomBytes(32).toString("base64");
  }

  const next = applyEnvUpdates(existing, updates);
  await fs.writeFile(envPath, next, "utf-8");

  return NextResponse.json({
    ok: true,
    message: `Credentials saved. NEXTAUTH_URL set to ${nextAuthUrl}. Restart \`npm run dev\` for NextAuth to pick up the new URL.`,
    keys_written: Object.keys(updates),
    nextauth_url: nextAuthUrl,
    redirect_uri: `${nextAuthUrl}/api/auth/callback/google`,
  });
}

function readEnvValue(content: string, key: string): string | null {
  const re = new RegExp(`^${key}=(.*)$`, "m");
  const m = content.match(re);
  if (!m) return null;
  return m[1].trim();
}

function applyEnvUpdates(content: string, updates: Record<string, string>): string {
  let out = content;
  for (const [key, value] of Object.entries(updates)) {
    const re = new RegExp(`^${key}=.*$`, "m");
    if (re.test(out)) {
      out = out.replace(re, `${key}=${value}`);
    } else {
      if (out.length > 0 && !out.endsWith("\n")) out += "\n";
      out += `${key}=${value}\n`;
    }
  }
  return out;
}
