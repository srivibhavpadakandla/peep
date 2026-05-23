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
  it("routes person_loitering → log_incident", async () => {
    const d = await r.decide(event({ event_type: "person_loitering" }));
    expect(d.workflow).toBe("log_incident");
  });
});
