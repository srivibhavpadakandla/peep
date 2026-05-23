"use client";

import type { CameraEvent } from "./contract";
import { confidencePercent, eventDescription, eventEmoji, eventTitle } from "./labels";

/**
 * Cross-channel notifier. Today: console (banner-styled) + browser desktop
 * notifications. Mobile push lands here when the app is ready.
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

const TONE: Record<
  CameraEvent["event_type"],
  { tone: "critical" | "success" | "warning" | "info"; followup?: string }
> = {
  package_taken: { tone: "critical", followup: "Filing a refund claim now." },
  package_not_arrived: { tone: "warning", followup: "Filing a 'never arrived' claim with Amazon." },
  weapon_detected: { tone: "critical" },
  multiple_loitering: { tone: "warning" },
  person_loitering: { tone: "warning" },
  after_hours_activity: { tone: "warning" },
  animal_detected: { tone: "info" },
  package_arrived: { tone: "success", followup: "Watching it for you." },
};

const TONE_STYLES: Record<string, string> = {
  critical: "background:#dc2626;color:white;padding:2px 6px;border-radius:3px;font-weight:bold;",
  warning: "background:#d97706;color:white;padding:2px 6px;border-radius:3px;font-weight:bold;",
  success: "background:#059669;color:white;padding:2px 6px;border-radius:3px;font-weight:bold;",
  info: "background:#0284c7;color:white;padding:2px 6px;border-radius:3px;font-weight:bold;",
};

export function notifyEvent(event: CameraEvent): void {
  const tone = TONE[event.event_type] ?? { tone: "info" as const };
  const title = `${eventEmoji(event.event_type)} ${eventTitle(event.event_type)}`;
  const body = `${eventDescription(event)} (Peep is ${confidencePercent(event.confidence)} sure)`;
  const time = new Date(event.timestamp).toLocaleTimeString();

  console.log(
    "%c " + title + " %c " + body + "  · " + time,
    TONE_STYLES[tone.tone],
    "color:#cbd5e1;",
  );

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: tone.followup ? `${body}\n${tone.followup}` : body,
        tag: event.event_type,
        requireInteraction: tone.tone === "critical",
      });
    } catch {
      // Browsers may throw on background pages — best-effort only.
    }
  }
}
