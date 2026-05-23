import { describe, it, expect } from "vitest";
import { orchestrate } from "../agents/orchestrator";
import { reason, safeReason } from "../agents/reasoning";
import { formatBody } from "../agents/gmail-send";
import type { CameraEvent, EventType } from "../contract";
import type { ReasoningVerdict } from "../agents/types";

const baseEvent = (overrides: Partial<CameraEvent> = {}): CameraEvent => ({
  event_type: "person_loitering",
  timestamp: 1700000000000,
  confidence: 0.85,
  evidence_clip: { url: "blob:abc", duration_ms: 5000, mime_type: "video/webm" },
  ...overrides,
});

const withDwell = (event: CameraEvent, dwellMs: number) =>
  ({ ...event, dwell_ms: dwellMs } as unknown as CameraEvent);

describe("orchestrator", () => {
  it("skips below 0.5 confidence", () => {
    const out = orchestrate(baseEvent({ confidence: 0.4 }));
    expect(out.next).toBe("skip");
    expect(out.workflow).toBe("no_action");
  });
  it("safe-fails on malformed input", () => {
    const out = orchestrate({ bogus: true } as unknown);
    expect(out.next).toBe("skip");
    expect(out.workflow).toBe("no_action");
    expect(out.reason).toMatch(/contract/i);
  });
  it("routes loitering to security email", () => {
    const out = orchestrate(baseEvent({ event_type: "person_loitering" }));
    expect(out.next).toBe("reason");
    expect(out.workflow).toBe("send_security_email");
  });
  it("routes multiple_loitering to security email", () => {
    const out = orchestrate(baseEvent({ event_type: "multiple_loitering" }));
    expect(out.workflow).toBe("send_security_email");
  });
  it("routes after_hours_activity to security email", () => {
    const out = orchestrate(baseEvent({ event_type: "after_hours_activity" }));
    expect(out.workflow).toBe("send_security_email");
  });
  it("routes weapon_detected to security email", () => {
    const out = orchestrate(baseEvent({ event_type: "weapon_detected" }));
    expect(out.workflow).toBe("send_security_email");
  });
  it("routes package_taken to amazon refund", () => {
    const out = orchestrate(baseEvent({ event_type: "package_taken" }));
    expect(out.workflow).toBe("amazon_refund_claim");
  });
  it("routes package_not_arrived to amazon refund", () => {
    const out = orchestrate(baseEvent({ event_type: "package_not_arrived" }));
    expect(out.workflow).toBe("amazon_refund_claim");
  });
  it("routes package_arrived to log_incident", () => {
    const out = orchestrate(baseEvent({ event_type: "package_arrived" }));
    expect(out.workflow).toBe("log_incident");
  });
});

describe("reasoning", () => {
  it("marks high-confidence loitering with sufficient dwell as REAL", () => {
    const event = withDwell(baseEvent({ confidence: 0.82 }), 12000);
    const v = reason(event, [], { loiteringThresholdMs: 5000 });
    expect(v.verdict).toBe("real");
    expect(v.confidence).toBe(0.82);
    expect(v.rationale).toContain("12s");
    expect(v.alert_summary).toContain("Person loitering");
  });
  it("FALSE_POSITIVE when confidence below 0.7", () => {
    const event = withDwell(baseEvent({ confidence: 0.6 }), 12000);
    const v = reason(event, [], { loiteringThresholdMs: 5000 });
    expect(v.verdict).toBe("false_positive");
    expect(v.rationale).toMatch(/0\.7/);
    expect(v.alert_summary).toBe("");
  });
  it("FALSE_POSITIVE when dwell below threshold (for loitering events)", () => {
    const event = withDwell(baseEvent({ confidence: 0.85 }), 2000);
    const v = reason(event, [], { loiteringThresholdMs: 5000 });
    expect(v.verdict).toBe("false_positive");
    expect(v.rationale).toMatch(/dwell/);
  });
  it("FALSE_POSITIVE when a matching event was seen in last 30s (flicker)", () => {
    const now = 1700000000000;
    const event = withDwell(baseEvent({ confidence: 0.9, timestamp: now }), 10000);
    const history = [
      withDwell(baseEvent({ confidence: 0.9, timestamp: now - 5000 }), 10000),
    ];
    const v = reason(event, history, { loiteringThresholdMs: 5000 });
    expect(v.verdict).toBe("false_positive");
    expect(v.rationale).toMatch(/flicker/);
  });
  it("treats history >30s old as NOT flicker", () => {
    const now = 1700000000000;
    const event = withDwell(baseEvent({ confidence: 0.9, timestamp: now }), 10000);
    const history = [
      withDwell(baseEvent({ confidence: 0.9, timestamp: now - 60_000 }), 10000),
    ];
    const v = reason(event, history, { loiteringThresholdMs: 5000 });
    expect(v.verdict).toBe("real");
  });
  it("cites ALL failing rules when multiple fail", () => {
    const now = 1700000000000;
    const event = withDwell(baseEvent({ confidence: 0.5, timestamp: now }), 1000);
    const v = reason(event, [], { loiteringThresholdMs: 5000 });
    expect(v.verdict).toBe("false_positive");
    expect(v.rationale).toMatch(/0\.7/);
    expect(v.rationale).toMatch(/dwell/);
  });
  it("safeReason returns false_positive on bogus input rather than throwing", () => {
    const v = safeReason(null, null);
    expect(v.verdict).toBe("false_positive");
    expect(v.confidence).toBe(0);
  });
});

describe("gmail body formatter", () => {
  it("is plain text only — no HTML tags", () => {
    const event = withDwell(baseEvent({ confidence: 0.82 }), 12000);
    const verdict: ReasoningVerdict = {
      verdict: "real",
      confidence: 0.82,
      rationale: "confidence 0.82 · dwelled 12s above 5s threshold · no recent flicker",
      alert_summary: "Person loitering at front door for 12s",
    };
    const body = formatBody(event, verdict);
    expect(body).not.toMatch(/<[a-z][^>]*>/i);
    expect(body).toContain("person_loitering");
    expect(body).toContain("82%"); // rounded confidence
    expect(body).toContain("12 seconds");
    expect(body).toContain("blob:abc");
  });
});

describe("contract shapes (sanity)", () => {
  const allEventTypes: EventType[] = [
    "package_arrived",
    "package_taken",
    "package_not_arrived",
    "person_loitering",
    "multiple_loitering",
    "weapon_detected",
    "after_hours_activity",
    "animal_detected",
  ];
  it("orchestrator returns a valid Workflow for every event type", () => {
    for (const t of allEventTypes) {
      const out = orchestrate(baseEvent({ event_type: t, confidence: 0.9 }));
      expect(out.next).toMatch(/reason|skip/);
      expect(out.workflow).toMatch(/send_security_email|amazon_refund_claim|log_incident|no_action/);
    }
  });
});
