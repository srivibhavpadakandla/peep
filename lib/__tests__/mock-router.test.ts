import { describe, it, expect } from "vitest";
import { MockRouter } from "../orchestration/router";
import type { CameraEvent } from "../contract";

const event = (overrides: Partial<CameraEvent> = {}): CameraEvent => ({
  event_type: "package_taken",
  timestamp: 1700000000000,
  confidence: 0.8,
  evidence_clip: { url: "blob:x", duration_ms: 3000, mime_type: "video/webm" },
  ...overrides,
});

describe("MockRouter", () => {
  const r = new MockRouter();
  it("routes package_taken → amazon_refund_claim", async () => {
    const d = await r.decide(event());
    expect(d.workflow).toBe("amazon_refund_claim");
    expect(d.params.order_id).toBeTruthy();
    expect(typeof d.params.item_description).toBe("string");
  });
  it("routes package_arrived → log_incident", async () => {
    const d = await r.decide(event({ event_type: "package_arrived" }));
    expect(d.workflow).toBe("log_incident");
  });
  it("routes package_taken with reason=package_stolen", async () => {
    const d = await r.decide(event({ event_type: "package_taken" }));
    expect(d.params.reason).toBe("package_stolen");
  });
  it("routes package_not_arrived → refund claim with reason=never_arrived", async () => {
    const d = await r.decide(event({ event_type: "package_not_arrived" }));
    expect(d.workflow).toBe("amazon_refund_claim");
    expect(d.params.reason).toBe("never_arrived");
    expect(d.params.order_id).toBeTruthy();
  });
  it("routes person_loitering → security_alert (warning)", async () => {
    const d = await r.decide(event({ event_type: "person_loitering" }));
    expect(d.workflow).toBe("security_alert");
    expect(d.params.severity).toBe("warning");
  });
  it("routes weapon_detected → security_alert (critical)", async () => {
    const d = await r.decide(event({ event_type: "weapon_detected" }));
    expect(d.workflow).toBe("security_alert");
    expect(d.params.severity).toBe("critical");
  });
  it("routes multiple_loitering → security_alert (high)", async () => {
    const d = await r.decide(event({ event_type: "multiple_loitering" }));
    expect(d.workflow).toBe("security_alert");
    expect(d.params.severity).toBe("high");
  });
  it("routes after_hours_activity → security_alert (warning)", async () => {
    const d = await r.decide(event({ event_type: "after_hours_activity" }));
    expect(d.workflow).toBe("security_alert");
    expect(d.params.severity).toBe("warning");
  });
});
