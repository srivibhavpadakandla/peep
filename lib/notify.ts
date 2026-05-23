"use client";

import type { CameraEvent } from "./contract";

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

export function notifyEvent(event: CameraEvent): void {
  const isTheft = event.event_type === "package_taken";
  const fmt = `[peep] ${event.event_type}  conf=${event.confidence.toFixed(2)}  at ${new Date(
    event.timestamp,
  ).toLocaleTimeString()}`;

  if (isTheft) {
    console.warn(
      "%c🚨 PACKAGE THEFT DETECTED %c " + fmt,
      "background:#dc2626;color:white;padding:2px 6px;border-radius:3px;font-weight:bold;",
      "color:#fca5a5;",
    );
  } else if (event.event_type === "package_arrived") {
    console.info(
      "%c📦 PACKAGE DELIVERED %c " + fmt,
      "background:#059669;color:white;padding:2px 6px;border-radius:3px;font-weight:bold;",
      "color:#6ee7b7;",
    );
  } else {
    console.log("%c[peep] " + event.event_type, "color:#94a3b8;", fmt);
  }

  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const title = isTheft ? "🚨 Package theft detected" : "📦 Package delivered";
    const body =
      isTheft
        ? `Confidence ${event.confidence.toFixed(2)}. Filing a refund claim now.`
        : `Confidence ${event.confidence.toFixed(2)}. Monitoring for theft.`;
    try {
      new Notification(title, { body, tag: event.event_type, requireInteraction: isTheft });
    } catch {
      // Browsers may throw on background pages — best-effort only.
    }
  }
}
