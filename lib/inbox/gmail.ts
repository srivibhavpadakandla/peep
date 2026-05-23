import { google, type gmail_v1 } from "googleapis";
import type { InboxEmail } from "./types";

const MAX_MESSAGES = 25;

/**
 * Fetch recent emails from Gmail and shape them like the seeded InboxEmail.
 * Query: last 2 days, primary category, skip spam/trash.
 */
export async function fetchGmailInbox(accessToken: string): Promise<InboxEmail[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    q: "newer_than:2d category:primary -in:spam -in:trash",
    maxResults: MAX_MESSAGES,
  });

  const messages = list.data.messages ?? [];
  const full = await Promise.all(
    messages.map((m) =>
      gmail.users.messages.get({ userId: "me", id: m.id!, format: "full" }).then((r) => r.data),
    ),
  );

  return full.map(toInboxEmail).filter((e): e is InboxEmail => e !== null);
}

function toInboxEmail(msg: gmail_v1.Schema$Message): InboxEmail | null {
  if (!msg.id) return null;
  const headers = msg.payload?.headers ?? [];
  const header = (name: string) =>
    headers.find((h: gmail_v1.Schema$MessagePartHeader) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

  const received_at = msg.internalDate ? Number(msg.internalDate) : Date.now();
  return {
    id: msg.id,
    from: header("From"),
    subject: header("Subject"),
    received_at,
    body: extractPlainText(msg.payload) || msg.snippet || "",
  };
}

function extractPlainText(payload: gmail_v1.Schema$MessagePart | null | undefined): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  for (const part of payload.parts ?? []) {
    const found = extractPlainText(part);
    if (found) return found;
  }
  return "";
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  try {
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return "";
  }
}
