import { describe, it, expect } from "vitest";
import { AnimalMonitor } from "../vision/animal-monitor";
import type { Detection } from "../vision/detector";

const dog = (score = 0.85): Detection => ({ label: "dog", score, bbox: [10, 10, 80, 60] });
const bear = (score = 0.9): Detection => ({ label: "bear", score, bbox: [200, 100, 120, 140] });
const noise = (): Detection => ({ label: "couch", score: 0.6, bbox: [0, 0, 10, 10] });

describe("AnimalMonitor", () => {
  it("emits animal_detected when an enabled animal is in frame", () => {
    const am = new AnimalMonitor({ oncePerSession: false, cooldownMs: 0 });
    const d = am.ingest([dog()], 0);
    expect(d?.event_type).toBe("animal_detected");
    expect(d?.meta.animal).toBe("dog");
    expect(d?.meta.severity).toBe("info");
  });

  it("returns null for non-enabled labels", () => {
    const am = new AnimalMonitor({ animalLabels: ["bear"], oncePerSession: false, cooldownMs: 0 });
    expect(am.ingest([dog()], 0)).toBeNull();
  });

  it("prefers bear over dog when both are in frame", () => {
    const am = new AnimalMonitor({ oncePerSession: false, cooldownMs: 0 });
    const d = am.ingest([dog(), bear()], 0);
    expect(d?.meta.animal).toBe("bear");
    expect(d?.meta.severity).toBe("high");
  });

  it("respects per-label cooldown independently", () => {
    const am = new AnimalMonitor({ oncePerSession: false, cooldownMs: 5000 });
    expect(am.ingest([dog()], 0)?.meta.animal).toBe("dog");
    // Dog emission inside cooldown — blocked.
    expect(am.ingest([dog()], 1000)).toBeNull();
    // Bear is on its own cooldown — should still fire.
    expect(am.ingest([bear()], 1000)?.meta.animal).toBe("bear");
  });

  it("fires once per session per label when oncePerSession is on", () => {
    const am = new AnimalMonitor({ oncePerSession: true, cooldownMs: 0, sessionClearMs: 500 });
    expect(am.ingest([dog()], 0)?.meta.animal).toBe("dog");
    expect(am.ingest([dog()], 200)).toBeNull();
    expect(am.ingest([dog()], 5000)).toBeNull();

    // Dog leaves long enough → new session.
    am.ingest([], 6000);
    am.ingest([], 6600); // > sessionClearMs after gap started
    expect(am.ingest([dog()], 7000)?.meta.animal).toBe("dog");
  });

  it("ignores noisy detections below minScore", () => {
    const am = new AnimalMonitor({ minScore: 0.7, oncePerSession: false, cooldownMs: 0 });
    expect(am.ingest([{ label: "dog", score: 0.4, bbox: [0, 0, 10, 10] }, noise()], 0)).toBeNull();
  });

  it("returns null when disabled", () => {
    const am = new AnimalMonitor({ enabled: false, oncePerSession: false, cooldownMs: 0 });
    expect(am.ingest([dog(), bear()], 0)).toBeNull();
  });
});
