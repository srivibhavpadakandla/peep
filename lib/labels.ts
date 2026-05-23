import type { CameraEvent, EventType } from "./contract";
import type { OrchestrationDecision } from "./orchestration/router";
import type { BrowserAgentResult } from "./browser-agent/types";

/**
 * Human-facing labels. Everything user-visible in the cockpit should route
 * through here so a non-engineer can read the UI.
 */

interface EventLabel {
  /** Short title, e.g. "Package taken". */
  title: string;
  /** Display emoji. */
  emoji: string;
  /** One-line plain-English description. */
  description: string;
}

const EVENT_LABELS: Record<EventType, EventLabel> = {
  package_arrived: {
    title: "Package delivered",
    emoji: "📦",
    description: "A delivery just arrived at the door.",
  },
  package_taken: {
    title: "Package taken",
    emoji: "🚨",
    description: "Someone took a package from the doorstep.",
  },
  package_not_arrived: {
    title: "Package didn't arrive",
    emoji: "❓",
    description: "A package expected today never showed up.",
  },
  person_loitering: {
    title: "Person at the door",
    emoji: "👤",
    description: "Someone has been at the door for a while.",
  },
  multiple_loitering: {
    title: "Multiple people at the door",
    emoji: "👥",
    description: "Two or more people are hanging around the doorstep.",
  },
  weapon_detected: {
    title: "Weapon spotted",
    emoji: "⚠️",
    description: "A weapon was visible on camera.",
  },
  after_hours_activity: {
    title: "After-hours visitor",
    emoji: "🌙",
    description: "Someone is at the door during quiet hours.",
  },
  animal_detected: {
    title: "Animal visitor",
    emoji: "🐾",
    description: "An animal was spotted on camera.",
  },
};

export function eventTitle(eventType: EventType): string {
  return EVENT_LABELS[eventType]?.title ?? eventType;
}

export function eventEmoji(eventType: EventType): string {
  return EVENT_LABELS[eventType]?.emoji ?? "•";
}

export function eventDescription(event: CameraEvent): string {
  const e = EVENT_LABELS[event.event_type];
  if (!e) return event.event_type;
  // Pull in animal-specific detail if present.
  const animal = (event as unknown as { animal?: string }).animal;
  if (event.event_type === "animal_detected" && animal) {
    const noun = animal === "bear" ? "A bear" : `A ${animal}`;
    return `${noun} was spotted on camera.`;
  }
  return e.description;
}

/** "74%" or similar. */
export function confidencePercent(c: number): string {
  return `${Math.round(c * 100)}%`;
}

/** "high confidence" / "medium" / "low" for qualitative labeling. */
export function confidenceQual(c: number): "high" | "medium" | "low" {
  if (c >= 0.7) return "high";
  if (c >= 0.5) return "medium";
  return "low";
}

/** Friendly description of what Peep decided to do. */
export function decisionSentence(decision: OrchestrationDecision): string {
  switch (decision.workflow) {
    case "amazon_refund_claim": {
      const reason = String(decision.params.reason ?? "");
      if (reason === "package_stolen") return "Filing a refund claim with Amazon for the stolen package.";
      if (reason === "never_arrived") return "Filing a 'package never arrived' claim with Amazon.";
      return "Filing a refund claim with Amazon.";
    }
    case "security_alert":
      return "Logging a security alert.";
    case "log_incident":
      return "Logging this in the activity feed.";
    case "no_action":
      return "No action needed.";
    default:
      return decision.reason;
  }
}

/** Sentence describing the outcome of the browser agent. */
export function resultSentence(result: BrowserAgentResult): string {
  if (!result.success) {
    return `Couldn't complete the action: ${result.error ?? "unknown error"}.`;
  }
  switch (result.workflow) {
    case "amazon_refund_claim":
      return `Refund filed with Amazon. Confirmation: ${formatReceiptId(result.receipt_id)}.`;
    case "security_alert":
      return `Security alert logged. Reference: ${formatReceiptId(result.receipt_id)}.`;
    case "log_incident":
      return "Saved to the activity feed.";
    case "no_action":
      return "No action was needed.";
    default:
      return "Done.";
  }
}

/** Pretty receipt/alert ID for display. */
export function formatReceiptId(id: string | undefined): string {
  if (!id) return "—";
  return id.toUpperCase();
}
