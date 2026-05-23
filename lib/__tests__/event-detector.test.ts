import { describe, it, expect } from "vitest";
import { EventDetector, bboxesNear } from "../vision/event-detector";
import type { Detection } from "../vision/detector";

const TARGET_BBOX: [number, number, number, number] = [100, 100, 50, 50];
const NEAR_BBOX: [number, number, number, number] = [140, 100, 50, 80];
const FAR_BBOX: [number, number, number, number] = [400, 400, 60, 100];

const target = (score = 0.9): Detection => ({ label: "backpack", score, bbox: TARGET_BBOX });
const personNear = (score = 0.9): Detection => ({ label: "person", score, bbox: NEAR_BBOX });
const personFar = (score = 0.9): Detection => ({ label: "person", score, bbox: FAR_BBOX });

describe("bboxesNear", () => {
  it("treats overlapping bboxes as near", () => {
    expect(bboxesNear(TARGET_BBOX, NEAR_BBOX, 0.5)).toBe(true);
  });
  it("treats distant bboxes as not near", () => {
    expect(bboxesNear(TARGET_BBOX, FAR_BBOX, 0.5)).toBe(false);
  });
});

describe("EventDetector — delivery", () => {
  it("emits package_arrived after the delivery person clears the package", () => {
    const ed = new EventDetector({
      arrivalStableMs: 100,
      clearanceMs: 200,
      absentMs: 100,
      cooldownMs: 0,
      approachWindowMs: 5000,
    });
    // Delivery person walks up and places the package.
    expect(ed.ingest([target(), personNear()], 0)).toBeNull();
    expect(ed.ingest([target(), personNear()], 80)).toBeNull();
    // Person hasn't cleared yet — no arrival.
    expect(ed.ingest([target()], 150)).toBeNull(); // person stepped out at t=150
    // Need clearanceMs of "no person near" before arrival fires.
    const decision = ed.ingest([target()], 400);
    expect(decision?.event_type).toBe("package_arrived");
    expect(decision?.confidence).toBeGreaterThan(0);
    expect(ed.getPhase()).toBe("resting");
  });

  it("does NOT emit package_arrived if target flickers before stable", () => {
    const ed = new EventDetector({ arrivalStableMs: 500, clearanceMs: 100, cooldownMs: 0 });
    ed.ingest([target()], 0);
    ed.ingest([], 100); // gone too soon
    expect(ed.getPhase()).toBe("idle");
  });
});

describe("EventDetector — theft", () => {
  function deliverAndRest(ed: EventDetector, start = 0): number {
    // Drives the state machine to "resting" cleanly. Returns the timestamp the
    // state machine is at when it returns.
    ed.ingest([target()], start);
    ed.ingest([target()], start + 200); // stable enough; no person ever observed
    return start + 200;
  }

  it("emits package_taken when a person approaches a resting package and it vanishes", () => {
    const ed = new EventDetector({
      arrivalStableMs: 100,
      clearanceMs: 100,
      absentMs: 100,
      cooldownMs: 0,
      approachWindowMs: 2000,
    });
    let t = deliverAndRest(ed);
    // Skip past arrival (we just want to be in resting).
    ed.ingest([target()], (t += 500));
    expect(ed.getPhase()).toBe("resting");

    // Thief approaches.
    ed.ingest([target(), personNear()], (t += 100));
    expect(ed.getPhase()).toBe("at_risk");

    // Thief takes the package.
    ed.ingest([personNear()], (t += 50));
    const decision = ed.ingest([personNear()], (t += 200));
    expect(decision?.event_type).toBe("package_taken");
    expect(decision?.confidence).toBeGreaterThan(0);
  });

  it("does NOT emit package_taken if no person was ever near (benign disappearance)", () => {
    const ed = new EventDetector({
      arrivalStableMs: 100,
      clearanceMs: 100,
      absentMs: 100,
      cooldownMs: 0,
    });
    let t = deliverAndRest(ed);
    ed.ingest([target()], (t += 500));
    expect(ed.getPhase()).toBe("resting");

    // Package vanishes; no person involved.
    ed.ingest([], (t += 100));
    expect(ed.ingest([], (t += 200))).toBeNull();
    expect(ed.getPhase()).toBe("idle");
  });

  it("does NOT emit package_taken for a distant person", () => {
    const ed = new EventDetector({
      arrivalStableMs: 100,
      clearanceMs: 100,
      absentMs: 100,
      cooldownMs: 0,
      approachWindowMs: 2000,
    });
    let t = deliverAndRest(ed);
    ed.ingest([target()], (t += 500));
    ed.ingest([target(), personFar()], (t += 100));
    expect(ed.getPhase()).toBe("resting"); // far person doesn't elevate to at_risk
    ed.ingest([personFar()], (t += 50));
    expect(ed.ingest([personFar()], (t += 200))).toBeNull();
  });

  it("respects cooldown after a successful theft emit", () => {
    const ed = new EventDetector({
      arrivalStableMs: 100,
      clearanceMs: 100,
      absentMs: 100,
      cooldownMs: 1000,
      approachWindowMs: 2000,
    });
    let t = deliverAndRest(ed);
    ed.ingest([target()], (t += 500));
    ed.ingest([target(), personNear()], (t += 100));
    ed.ingest([personNear()], (t += 50));
    const a = ed.ingest([personNear()], (t += 200));
    expect(a?.event_type).toBe("package_taken");

    // Stage another theft inside cooldown — must be blocked.
    ed.ingest([target()], (t += 100));
    ed.ingest([target()], (t += 200));
    ed.ingest([target(), personNear()], (t += 100));
    ed.ingest([personNear()], (t += 50));
    expect(ed.ingest([personNear()], (t += 200))).toBeNull();
  });

  it("exposes person presence + proximity in getState()", () => {
    const ed = new EventDetector();
    ed.ingest([target(), personNear()], 0);
    const s1 = ed.getState();
    expect(s1.personPresent).toBe(true);
    expect(s1.personNearTarget).toBe(true);

    ed.ingest([target()], 100);
    const s2 = ed.getState();
    expect(s2.personPresent).toBe(false);
    expect(s2.personNearTarget).toBe(false);
  });

  it("ignores detections below minScore", () => {
    const ed = new EventDetector({ arrivalStableMs: 100, minScore: 0.7, cooldownMs: 0 });
    ed.ingest([target(0.4)], 0);
    ed.ingest([target(0.4)], 200);
    expect(ed.getPhase()).toBe("idle");
  });
});
