import { describe, it, expect } from "vitest";
import { isCameraEvent } from "../contract";

const valid = {
  event_type: "package_taken",
  timestamp: 1700000000000,
  confidence: 0.83,
  evidence_clip: { url: "blob:abc", duration_ms: 3000, mime_type: "video/webm" },
};

describe("isCameraEvent", () => {
  it("accepts a valid event", () => {
    expect(isCameraEvent(valid)).toBe(true);
  });
  it("rejects missing fields", () => {
    expect(isCameraEvent({ ...valid, event_type: undefined })).toBe(false);
    expect(isCameraEvent({ ...valid, evidence_clip: undefined })).toBe(false);
  });
  it("rejects confidence outside [0,1]", () => {
    expect(isCameraEvent({ ...valid, confidence: 1.2 })).toBe(false);
    expect(isCameraEvent({ ...valid, confidence: -0.1 })).toBe(false);
  });
  it("rejects malformed evidence_clip", () => {
    expect(isCameraEvent({ ...valid, evidence_clip: { url: "x" } })).toBe(false);
  });
  it("rejects non-objects", () => {
    expect(isCameraEvent(null)).toBe(false);
    expect(isCameraEvent("string")).toBe(false);
  });
});
