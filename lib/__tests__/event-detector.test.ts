import { describe, it, expect } from "vitest";
import { EventDetector } from "../vision/event-detector";
import type { Detection } from "../vision/detector";

const present = (label = "backpack", score = 0.9): Detection[] => [
  { label, score, bbox: [10, 10, 50, 50] },
];
const absent = (): Detection[] => [];

describe("EventDetector", () => {
  it("emits package_taken after stable presence then absence", () => {
    const ed = new EventDetector({ stableMs: 100, absentMs: 100, cooldownMs: 0 });
    expect(ed.ingest(present(), 0)).toBeNull();
    expect(ed.ingest(present(), 50)).toBeNull();
    expect(ed.ingest(present(), 150)).toBeNull(); // tracked > stableMs
    // disappear
    expect(ed.ingest(absent(), 200)).toBeNull(); // enters absent
    const decision = ed.ingest(absent(), 350); // absent > absentMs
    expect(decision).not.toBeNull();
    expect(decision?.event_type).toBe("package_taken");
    expect(decision?.confidence).toBeGreaterThan(0);
    expect(decision?.confidence).toBeLessThanOrEqual(1);
  });

  it("does not emit if presence was not stable", () => {
    const ed = new EventDetector({ stableMs: 200, absentMs: 100, cooldownMs: 0 });
    expect(ed.ingest(present(), 0)).toBeNull();
    expect(ed.ingest(absent(), 50)).toBeNull(); // flickered before stable
    expect(ed.ingest(absent(), 200)).toBeNull();
    expect(ed.getPhase()).toBe("waiting");
  });

  it("respects cooldown", () => {
    const ed = new EventDetector({ stableMs: 50, absentMs: 50, cooldownMs: 500 });
    ed.ingest(present(), 0);
    ed.ingest(present(), 60); // stable
    ed.ingest(absent(), 70); // enters absent
    const a = ed.ingest(absent(), 130);
    expect(a?.event_type).toBe("package_taken");
    // Try to fire again immediately — must not, even if conditions met.
    ed.ingest(present(), 200);
    ed.ingest(present(), 260);
    ed.ingest(absent(), 270);
    const b = ed.ingest(absent(), 330);
    expect(b).toBeNull();
  });

  it("ignores detections below minScore", () => {
    const ed = new EventDetector({ stableMs: 50, absentMs: 50, cooldownMs: 0, minScore: 0.7 });
    ed.ingest(present("backpack", 0.4), 0);
    ed.ingest(present("backpack", 0.4), 60);
    expect(ed.getPhase()).toBe("waiting");
  });

  it("ignores wrong labels", () => {
    const ed = new EventDetector({ stableMs: 50, absentMs: 50, cooldownMs: 0, targetLabel: "backpack" });
    ed.ingest(present("person", 0.9), 0);
    ed.ingest(present("person", 0.9), 100);
    expect(ed.getPhase()).toBe("waiting");
  });
});
