/**
 * Design-data adapter for the Peep Console.
 *
 * Provides the metadata the new UI needs (event labels, severity palette,
 * agent descriptors) plus mock fallback events for when the real store hasn't
 * produced anything yet. Real data from the store always wins when available;
 * mocks only render to keep the design demonstrable in an empty state.
 */
import type { EventType } from "@/lib/contract";

export type Severity = "info" | "warning" | "high" | "critical";

export interface EventMeta {
  label: string;
  emoji: string;
  severity: Severity;
  action: string;
}

export const EVENT_META: Record<EventType, EventMeta> = {
  package_arrived: { label: "Package arrived", emoji: "📦", severity: "info", action: "Logged delivery" },
  package_taken: { label: "Package taken", emoji: "📦", severity: "critical", action: "Filed refund with Amazon" },
  package_not_arrived: {
    label: "Package never arrived",
    emoji: "📦",
    severity: "high",
    action: 'Filed "never arrived" claim',
  },
  person_loitering: { label: "Person loitering", emoji: "⚠️", severity: "warning", action: "Sent security email" },
  multiple_loitering: {
    label: "Multiple people loitering",
    emoji: "⚠️",
    severity: "high",
    action: "Sent security email",
  },
  weapon_detected: {
    label: "Weapon detected",
    emoji: "🚨",
    severity: "critical",
    action: "Sent security email · requires acknowledgment",
  },
  after_hours_activity: {
    label: "After-hours activity",
    emoji: "🌙",
    severity: "warning",
    action: "Sent security email",
  },
  animal_detected: { label: "Animal detected", emoji: "🐾", severity: "info", action: "Logged sighting" },
};

export const SEVERITY: Record<Severity, { color: string; label: string; bg: string; ring: string }> = {
  info: { color: "#38bdf8", label: "INFO", bg: "rgba(56,189,248,0.08)", ring: "rgba(56,189,248,0.35)" },
  warning: { color: "#fbbf24", label: "WARNING", bg: "rgba(251,191,36,0.08)", ring: "rgba(251,191,36,0.35)" },
  high: { color: "#f97316", label: "HIGH", bg: "rgba(249,115,22,0.08)", ring: "rgba(249,115,22,0.35)" },
  critical: { color: "#ef4444", label: "CRITICAL", bg: "rgba(239,68,68,0.08)", ring: "rgba(239,68,68,0.35)" },
};

export interface AgentDescriptor {
  id: "vision" | "orchestrator" | "reasoning" | "executor";
  name: string;
  role: string;
  color: string;
  explainer: string;
}

export const AGENTS: AgentDescriptor[] = [
  {
    id: "vision",
    name: "Vision",
    role: "Watches every frame. Detects objects with COCO-SSD.",
    color: "#22d3ee",
    explainer:
      "Reads the live camera in your browser. Doesn't decide anything — just emits what it sees, with a confidence score.",
  },
  {
    id: "orchestrator",
    name: "Orchestrator",
    role: "Routes events to the right workflow. Drops noise below 50%.",
    color: "#60a5fa",
    explainer: "The traffic cop. Decides which events are worth thinking about, and which to throw away.",
  },
  {
    id: "reasoning",
    name: "Reasoning",
    role: "Verifies events as REAL or FALSE_POSITIVE.",
    color: "#fbbf24",
    explainer:
      "Looks at the broader context — who's in frame, when, what they're doing — and decides whether this actually warrants action.",
  },
  {
    id: "executor",
    name: "Executor",
    role: "Takes exactly one autonomous action. Never chains.",
    color: "#10b981",
    explainer: "The hands. Sends one email, files one refund, logs one alert — then stops. By design.",
  },
];

// ---------- helpers ----------
export function fmtTime(d: Date | number): string {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
export function fmtTimeS(d: Date | number): string {
  return new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
export function fmtDay(d: Date | number): string {
  const dayMs = 86_400_000;
  const date = new Date(d);
  const diffDays = Math.floor((Date.now() - date.getTime()) / dayMs);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ---------- design-event shape (UI layer only) ----------
// This is the shape the design renders. We map from the real AgentRun + CameraEvent
// onto it. Real data wins; falls back to the demo events below.
export interface UiAgentStage {
  sentence: string;
  timing_ms?: number;
  verdict?: string;
  failing_rule?: string;
  json?: Record<string, unknown>;
}

export interface UiAgentEvent {
  id: string;
  type: EventType;
  timestamp: number;
  confidence: number;
  vision: UiAgentStage;
  orchestrator: UiAgentStage;
  reasoning: UiAgentStage;
  executor: (UiAgentStage & { action?: string; reference?: string; dest?: string }) | null;
}

// ---------- demo events (used when agentRuns is empty so the design isn't blank) ----------
const today = (() => {
  const d = new Date();
  d.setHours(14, 0, 0, 0);
  return d;
})();
const tMinus = (mins: number) => new Date(today.getTime() - mins * 60_000);

interface DemoSeed {
  id: string;
  type: EventType;
  ts: Date;
  confidence: number;
  vision: string;
  orch: string;
  reason: string;
  failingRule?: string;
  verdict?: string;
  exec?: string;
  ref?: string;
  dest?: string;
  to?: number;
  tr?: number;
  te?: number;
  cls?: string;
}

const seed = (s: DemoSeed): UiAgentEvent => ({
  id: s.id,
  type: s.type,
  timestamp: s.ts.getTime(),
  confidence: s.confidence,
  vision: {
    sentence: s.vision,
    timing_ms: 78,
    json: { class: s.cls ?? "—", confidence: s.confidence, frame_id: "frm_" + s.id.slice(-4) },
  },
  orchestrator: {
    sentence: s.orch,
    timing_ms: s.to ?? 12,
    json: { routed_to: "reasoning", workflow: s.type, confidence_gate: "passed (>= 0.50)" },
  },
  reasoning: {
    sentence: s.reason,
    verdict: s.verdict ?? "REAL",
    failing_rule: s.failingRule,
    timing_ms: s.tr ?? 612,
    json: { verdict: s.verdict ?? "REAL", rule_evaluated: s.failingRule ?? "context_dwell_check" },
  },
  executor: s.exec
    ? {
        sentence: s.exec,
        action: EVENT_META[s.type].action,
        reference: s.ref,
        dest: s.dest,
        timing_ms: s.te ?? 1240,
        json: { action: EVENT_META[s.type].action, reference_id: s.ref, destination: s.dest, status: "success" },
      }
    : null,
});

export const DEMO_EVENTS: UiAgentEvent[] = [
  seed({
    id: "evt_a1",
    type: "person_loitering",
    ts: tMinus(2),
    confidence: 0.91,
    cls: "person",
    vision: "Person at the front door for 14 seconds.",
    orch: "Routed to security workflow.",
    reason: "Real. Movement is minimal and dwell time exceeds the 12-second threshold.",
    failingRule: "dwell_exceeds_12s",
    exec: "Security email queued to jamie@hello.com.",
    ref: "MSG-7K2P9X",
    dest: "jamie@hello.com",
    to: 9,
    tr: 587,
    te: 1180,
  }),
  seed({
    id: "evt_a2",
    type: "package_arrived",
    ts: tMinus(38),
    confidence: 0.96,
    cls: "package",
    vision: "Cardboard box placed on porch.",
    orch: "Routed to delivery workflow.",
    reason: "Real. Matches the expected Amazon delivery window for order #112-8847.",
    failingRule: "match_expected_delivery",
    exec: "Logged delivery. Marked order #112-8847 as 'Received'.",
    ref: "LOG-44A1",
    dest: "local",
    to: 8,
    tr: 410,
    te: 220,
  }),
  seed({
    id: "evt_a3",
    type: "animal_detected",
    ts: tMinus(74),
    confidence: 0.84,
    cls: "dog",
    vision: "Dog walked past the porch.",
    orch: "Routed to passive log workflow.",
    reason: "Real. Domestic animal class — no escalation required.",
    failingRule: "animal_class_check",
    exec: "Logged sighting. No action taken.",
    ref: "LOG-44A0",
    dest: "local",
    to: 7,
    tr: 290,
    te: 80,
  }),
  seed({
    id: "evt_a4",
    type: "multiple_loitering",
    ts: tMinus(180),
    confidence: 0.88,
    cls: "person ×2",
    vision: "Two people at the door for 22 seconds.",
    orch: "Routed to security workflow.",
    reason: "Real. Two persons co-present beyond the 12-second threshold.",
    failingRule: "multi_person_dwell",
    exec: "Security email sent to jamie@hello.com.",
    ref: "MSG-7J9N1A",
    dest: "jamie@hello.com",
    to: 10,
    tr: 720,
    te: 1390,
  }),
  seed({
    id: "evt_a5",
    type: "package_taken",
    ts: tMinus(245),
    confidence: 0.93,
    cls: "person + package",
    vision: "Person picked up package and left frame.",
    orch: "Routed to theft workflow.",
    reason:
      "Real. Person is not in delivery uniform and order #112-8826 was already marked received yesterday.",
    failingRule: "unauthorized_pickup",
    exec: "Refund claim filed with Amazon.",
    ref: "RFND-XQ7K9",
    dest: "amazon.com",
    to: 14,
    tr: 912,
    te: 2210,
  }),
  seed({
    id: "evt_a6",
    type: "person_loitering",
    ts: tMinus(412),
    confidence: 0.41,
    cls: "person",
    vision: "Brief silhouette in frame.",
    orch: "Dropped. Confidence 0.41 < gate 0.50.",
    reason: "—",
    failingRule: "confidence_gate",
    verdict: "DROPPED",
    to: 4,
    tr: 0,
  }),
  seed({
    id: "evt_a7",
    type: "weapon_detected",
    ts: tMinus(620),
    confidence: 0.79,
    cls: "weapon-like",
    vision: "Object resembling a long tool, held by person.",
    orch: "Routed to weapon workflow.",
    reason:
      "False positive. Object classified as a garden rake based on aspect ratio and handle taper.",
    failingRule: "weapon_shape_disambiguation",
    verdict: "FALSE_POSITIVE",
    to: 11,
    tr: 1410,
  }),
  seed({
    id: "evt_b1",
    type: "after_hours_activity",
    ts: tMinus(1080),
    confidence: 0.86,
    cls: "person",
    vision: "Person at door at 02:14 local time.",
    orch: "Routed to after-hours workflow.",
    reason: "Real. Inside the configured quiet-hours window (22:00 – 06:00).",
    failingRule: "within_quiet_hours",
    exec: "Security email sent.",
    ref: "MSG-6T4Q3B",
    dest: "jamie@hello.com",
    to: 9,
    tr: 645,
    te: 1520,
  }),
  seed({
    id: "evt_b2",
    type: "animal_detected",
    ts: tMinus(1340),
    confidence: 0.77,
    cls: "bear",
    vision: "Large quadruped on porch.",
    orch: "Routed to high-severity animal workflow.",
    reason: "Real. Class is bear — escalation rule applies.",
    failingRule: "animal_class_check",
    exec: "Security email sent. Bear sighting flagged.",
    ref: "MSG-6S1K7D",
    dest: "jamie@hello.com",
    to: 9,
    tr: 510,
    te: 1380,
  }),
  seed({
    id: "evt_b3",
    type: "package_not_arrived",
    ts: tMinus(1620),
    confidence: 0.99,
    cls: "(rule-based)",
    vision: "No package detected within delivery window.",
    orch: "Routed to delivery dispute workflow.",
    reason: "Real. Amazon marked order #112-8800 as delivered 4 hours ago; no delivery event was seen on camera.",
    failingRule: "expected_delivery_missing",
    exec: '"Never arrived" claim filed with Amazon.',
    ref: "RFND-MQ2L4",
    dest: "amazon.com",
    to: 15,
    tr: 1080,
    te: 2470,
  }),
];

export interface DemoLogEntry {
  t: number;
  source: "vision" | "orchestration" | "browser" | "system";
  text: string;
}

export const LOG_SOURCES = ["vision", "orchestration", "browser", "system"] as const;

export const DEMO_LOGS: DemoLogEntry[] = [
  { t: tMinus(0.3).getTime(), source: "vision", text: "Detector running at 12.4 fps." },
  { t: tMinus(2).getTime(), source: "orchestration", text: "Routed person_loitering (0.91) → reasoning." },
  { t: tMinus(2).getTime(), source: "system", text: "Security email sent to jamie@hello.com. Reference MSG-7K2P9X." },
  { t: tMinus(8).getTime(), source: "vision", text: "Person entered frame (bbox 212×144 → 388×612)." },
  { t: tMinus(38).getTime(), source: "orchestration", text: "Routed package_arrived (0.96) → reasoning." },
  { t: tMinus(38).getTime(), source: "system", text: "Marked order #112-8847 as 'Received'." },
  { t: tMinus(45).getTime(), source: "browser", text: "Gmail sweep: 1 new delivery email from Amazon." },
  { t: tMinus(74).getTime(), source: "vision", text: "Detected dog on porch (0.84)." },
  { t: tMinus(180).getTime(), source: "orchestration", text: "Routed multiple_loitering (0.88) → reasoning." },
  { t: tMinus(245).getTime(), source: "orchestration", text: "Routed package_taken (0.93) → reasoning." },
  { t: tMinus(245).getTime(), source: "system", text: "Refund filed with Amazon. Reference RFND-XQ7K9." },
  { t: tMinus(412).getTime(), source: "orchestration", text: "Dropped person_loitering (0.41) — below gate." },
  { t: tMinus(620).getTime(), source: "orchestration", text: "Routed weapon_detected (0.79) → reasoning." },
  { t: tMinus(620).getTime(), source: "system", text: "Reasoning verdict: FALSE_POSITIVE. No executor action taken." },
];

export interface DemoInboxItem {
  id: string;
  item: string;
  status: "pending" | "received";
  from: string;
  eta: string;
}

export const DEMO_INBOX: DemoInboxItem[] = [
  { id: "112-8847-2031", item: "Anker USB-C charging brick, 65W", status: "received", from: "Amazon", eta: "11:30 AM" },
  { id: "112-8849-1148", item: "Hario V60 paper filters (200 ct)", status: "pending", from: "Amazon", eta: "2:15 PM" },
  { id: "112-8851-7702", item: "Sony WH-1000XM5 replacement earpads", status: "pending", from: "Amazon", eta: "4:00 PM" },
  { id: "UPS-7Z44K1", item: '"Birds of North America" — Sibley, hardcover', status: "pending", from: "UPS", eta: "5:30 PM" },
];

export const DEMO_USAGE = {
  cost_usd: 0.0734,
  tokens: 18421,
  calls: 41,
  recent: [
    { t: tMinus(2).getTime(), workflow: "person_loitering" as EventType, tokens: 612, cost: 0.0021 },
    { t: tMinus(38).getTime(), workflow: "package_arrived" as EventType, tokens: 410, cost: 0.0014 },
    { t: tMinus(180).getTime(), workflow: "multiple_loitering" as EventType, tokens: 720, cost: 0.0025 },
    { t: tMinus(245).getTime(), workflow: "package_taken" as EventType, tokens: 912, cost: 0.0031 },
    { t: tMinus(620).getTime(), workflow: "weapon_detected" as EventType, tokens: 1410, cost: 0.0049 },
    { t: tMinus(1080).getTime(), workflow: "after_hours_activity" as EventType, tokens: 645, cost: 0.0022 },
  ],
};

/**
 * Convert real AgentRuns from the store into the UI's event shape. Falls back
 * to the demo seed when the store has no runs yet.
 */
export interface RealAgentRunInput {
  ran_at: number;
  event: { event_type: EventType; timestamp: number; confidence: number };
  result: {
    orchestrator: { workflow: string; reason: string; next: string };
    reasoning?: { verdict: string; rationale: string; alert_summary?: string };
    executor?: { success: boolean; workflow: string; message_id?: string; error?: string };
    timings?: { orchestrator_ms: number; reasoning_ms?: number; executor_ms?: number; total_ms: number };
  };
}

export function adaptRun(r: RealAgentRunInput, idx: number): UiAgentEvent {
  const meta = EVENT_META[r.event.event_type];
  const exec = r.result.executor;
  return {
    id: `run_${r.ran_at}_${idx}`,
    type: r.event.event_type,
    timestamp: r.event.timestamp,
    confidence: r.event.confidence,
    vision: {
      sentence: `Detected ${meta.label.toLowerCase()} on camera.`,
      timing_ms: 78,
      json: { event_type: r.event.event_type, confidence: r.event.confidence },
    },
    orchestrator: {
      sentence: r.result.orchestrator.reason,
      timing_ms: r.result.timings?.orchestrator_ms,
      verdict: r.result.orchestrator.next === "skip" ? "DROPPED" : undefined,
      json: r.result.orchestrator as unknown as Record<string, unknown>,
    },
    reasoning: r.result.reasoning
      ? {
          sentence: r.result.reasoning.rationale,
          verdict: r.result.reasoning.verdict.toUpperCase(),
          timing_ms: r.result.timings?.reasoning_ms,
          json: r.result.reasoning as unknown as Record<string, unknown>,
        }
      : { sentence: "Skipped — orchestrator dropped the event.", json: {} },
    executor: exec
      ? {
          sentence: exec.success
            ? `${exec.workflow} succeeded.${exec.message_id ? ` Reference ${exec.message_id}.` : ""}`
            : `Failed: ${exec.error}`,
          action: meta.action,
          reference: exec.message_id,
          dest: exec.workflow === "amazon_refund_claim" ? "amazon.com" : "local",
          timing_ms: r.result.timings?.executor_ms,
          verdict: exec.success ? "DONE" : "FAILED",
          json: exec as unknown as Record<string, unknown>,
        }
      : null,
  };
}
