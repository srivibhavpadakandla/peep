import { google } from "googleapis";
import type { CameraEvent } from "../contract";
import type { ReasoningVerdict } from "./types";

/**
 * Build an RFC 5322 plain-text message and send it via the Gmail API as the
 * authenticated user. Returns the Gmail messageId on success.
 *
 * Hard constraints:
 *   - `to` is fixed to PEEP_ALERT_RECIPIENT — never accepts client input.
 *   - Subject truncated to 78 chars.
 *   - Body is plain text only: no HTML, no markdown, no CC, no BCC.
 *   - No access tokens or system-prompt content ever appears in the body.
 */
export async function sendGmailAlert({
  accessToken,
  event,
  verdict,
}: {
  accessToken: string;
  event: CameraEvent;
  verdict: ReasoningVerdict;
}): Promise<{ message_id: string; sent_at: string }> {
  const recipient = (process.env.PEEP_ALERT_RECIPIENT ?? "").trim();
  if (!recipient) {
    throw new Error("PEEP_ALERT_RECIPIENT is not set");
  }
  if (!isPlausibleEmail(recipient)) {
    throw new Error(`PEEP_ALERT_RECIPIENT is not a valid email address`);
  }

  const subject = truncate(`Peep alert: ${verdict.alert_summary}`, 78);
  const body = formatBody(event, verdict);

  const raw = toBase64Url(
    [
      `To: ${recipient}`,
      `Subject: ${escapeHeader(subject)}`,
      "MIME-Version: 1.0",
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 7bit",
      "",
      body,
    ].join("\r\n"),
  );

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth });

  const res = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  const id = res.data.id;
  if (!id) throw new Error("Gmail returned no message id");
  return { message_id: id, sent_at: new Date().toISOString() };
}

export function formatBody(event: CameraEvent, verdict: ReasoningVerdict): string {
  const dwellMs = (event as unknown as { dwell_ms?: number }).dwell_ms;
  const dwellSec = typeof dwellMs === "number" ? Math.round(dwellMs / 1000) : null;
  const quietHours = (event as unknown as { quiet_hours?: boolean }).quiet_hours === true;

  const lines = [
    `Peep saw something at your door.`,
    ``,
    `Event:        ${event.event_type}`,
    `Detected at:  ${new Date(event.timestamp).toISOString()}`,
    `Confidence:   ${Math.round(event.confidence * 100)}%`,
  ];
  if (dwellSec !== null) lines.push(`Dwell:        ${dwellSec} seconds`);
  lines.push(`Quiet hours:  ${quietHours ? "yes" : "no"}`);
  lines.push(``);
  lines.push(`Why Peep is alerting you:`);
  lines.push(verdict.rationale);
  lines.push(``);
  lines.push(`Evidence clip:`);
  lines.push(event.evidence_clip.url);
  lines.push(``);
  lines.push(`— Peep`);

  return lines.join("\n");
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + "…";
}

function toBase64Url(s: string): string {
  return Buffer.from(s, "utf-8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function escapeHeader(s: string): string {
  // Strip CR/LF to prevent header injection.
  return s.replace(/[\r\n]+/g, " ");
}

function isPlausibleEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
