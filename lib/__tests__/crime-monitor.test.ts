import { describe, it, expect } from "vitest";
import { CrimeMonitor, isInQuietHours } from "../vision/crime-monitor";
import type { Detection } from "../vision/detector";

const person = (score = 0.9, bbox: [number, number, number, number] = [10, 10, 50, 50]): Detection => ({
  label: "person",
  score,
  bbox,
});
const knife = (score = 0.8): Detection => ({ label: "knife", score, bbox: [50, 50, 20, 30] });

const ctx = { personNearTarget: false };

describe("isInQuietHours", () => {
  function at(hour: number) {
    const d = new Date();
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
  }
  it("non-wrapping window", () => {
    const opts = { quietHoursStart: 9, quietHoursEnd: 17 };
    expect(isInQuietHours(at(10), opts)).toBe(true);
    expect(isInQuietHours(at(8), opts)).toBe(false);
    expect(isInQuietHours(at(17), opts)).toBe(false);
  });
  it("wrapping window across midnight", () => {
    const opts = { quietHoursStart: 22, quietHoursEnd: 5 };
    expect(isInQuietHours(at(23), opts)).toBe(true);
    expect(isInQuietHours(at(3), opts)).toBe(true);
    expect(isInQuietHours(at(12), opts)).toBe(false);
  });
  it("empty window matches nothing", () => {
    expect(isInQuietHours(at(10), { quietHoursStart: 10, quietHoursEnd: 10 })).toBe(false);
  });
});

describe("CrimeMonitor — loitering", () => {
  it("emits person_loitering after dwellMs of solo presence away from the package", () => {
    const cm = new CrimeMonitor({ dwellMs: 1000, cooldownMs: 0, quietHoursEnabled: false });
    expect(cm.ingest([person()], 0, ctx)).toBeNull();
    expect(cm.ingest([person()], 500, ctx)).toBeNull();
    const decision = cm.ingest([person()], 1500, ctx);
    expect(decision?.event_type).toBe("person_loitering");
    expect(decision?.meta.person_count).toBe(1);
  });

  it("does NOT fire while the person is near the package", () => {
    const cm = new CrimeMonitor({ dwellMs: 500, cooldownMs: 0, quietHoursEnabled: false });
    cm.ingest([person()], 0, { personNearTarget: true });
    cm.ingest([person()], 600, { personNearTarget: true });
    expect(cm.ingest([person()], 1200, { personNearTarget: true })).toBeNull();
  });

  it("resets dwell when the person leaves frame", () => {
    const cm = new CrimeMonitor({ dwellMs: 1000, cooldownMs: 0, quietHoursEnabled: false });
    cm.ingest([person()], 0, ctx);
    cm.ingest([], 500, ctx); // person gone
    cm.ingest([person()], 800, ctx); // person back — dwell restarts
    expect(cm.ingest([person()], 1300, ctx)).toBeNull(); // only 500ms since restart
  });

  it("emits multiple_loitering when ≥ multiCount people are present", () => {
    const cm = new CrimeMonitor({ dwellMs: 500, multiCount: 2, cooldownMs: 0, quietHoursEnabled: false });
    cm.ingest([person(), person(0.85, [200, 10, 50, 50])], 0, ctx);
    const d = cm.ingest([person(), person(0.85, [200, 10, 50, 50])], 800, ctx);
    expect(d?.event_type).toBe("multiple_loitering");
    expect(d?.meta.person_count).toBe(2);
  });
});

describe("CrimeMonitor — weapon", () => {
  it("emits weapon_detected immediately when a weapon is in frame", () => {
    const cm = new CrimeMonitor({ cooldownMs: 0, quietHoursEnabled: false });
    const d = cm.ingest([person(), knife()], 0, ctx);
    expect(d?.event_type).toBe("weapon_detected");
    expect(d?.meta.weapon_labels).toContain("knife");
  });
  it("respects cooldown for weapon emissions", () => {
    const cm = new CrimeMonitor({ cooldownMs: 5000, quietHoursEnabled: false });
    cm.ingest([knife()], 0, ctx);
    expect(cm.ingest([knife()], 1000, ctx)).toBeNull();
    expect(cm.ingest([knife()], 6000, ctx)?.event_type).toBe("weapon_detected");
  });
});

describe("CrimeMonitor — after-hours", () => {
  it("emits after_hours_activity when in window and a person is present", () => {
    const cm = new CrimeMonitor({
      cooldownMs: 0,
      quietHoursEnabled: true,
      quietHoursStart: 0,
      quietHoursEnd: 24, // whole day → guaranteed in-window
    });
    const d = cm.ingest([person()], Date.now(), ctx);
    expect(d?.event_type).toBe("after_hours_activity");
  });
  it("does NOT emit when feature is disabled", () => {
    const cm = new CrimeMonitor({
      cooldownMs: 0,
      quietHoursEnabled: false,
      quietHoursStart: 0,
      quietHoursEnd: 24,
    });
    expect(cm.ingest([person()], Date.now(), ctx)?.event_type).not.toBe("after_hours_activity");
  });
});

describe("CrimeMonitor — priority ordering", () => {
  it("weapon beats loitering even when both conditions are met", () => {
    const cm = new CrimeMonitor({ dwellMs: 0, cooldownMs: 0, quietHoursEnabled: false });
    const d = cm.ingest([person(), knife()], 0, ctx);
    expect(d?.event_type).toBe("weapon_detected");
  });
});

describe("CrimeMonitor — master enable", () => {
  it("returns null for everything when enabled=false", () => {
    const cm = new CrimeMonitor({ enabled: false, dwellMs: 0, cooldownMs: 0, quietHoursEnabled: false });
    expect(cm.ingest([person(), knife()], 0, ctx)).toBeNull();
  });
});

describe("CrimeMonitor — fire-once-per-session", () => {
  it("fires only one alert per type per session", () => {
    const cm = new CrimeMonitor({
      dwellMs: 100,
      cooldownMs: 0,
      oncePerSession: true,
      sessionClearMs: 1000,
      quietHoursEnabled: false,
    });
    cm.ingest([person()], 0, ctx);
    const a = cm.ingest([person()], 200, ctx);
    expect(a?.event_type).toBe("person_loitering");
    // Within the same session — no re-fire, even seconds later.
    expect(cm.ingest([person()], 5000, ctx)).toBeNull();
    expect(cm.ingest([person()], 10000, ctx)).toBeNull();
  });

  it("starts a new session after the person leaves long enough", () => {
    const cm = new CrimeMonitor({
      dwellMs: 100,
      cooldownMs: 0,
      oncePerSession: true,
      sessionClearMs: 500,
      quietHoursEnabled: false,
    });
    cm.ingest([person()], 0, ctx);
    expect(cm.ingest([person()], 200, ctx)?.event_type).toBe("person_loitering");

    // Person leaves for longer than sessionClearMs.
    cm.ingest([], 300, ctx);
    cm.ingest([], 1000, ctx);
    cm.ingest([], 1500, ctx);
    // Comes back — new session, must be allowed to fire again.
    cm.ingest([person()], 1600, ctx);
    expect(cm.ingest([person()], 1800, ctx)?.event_type).toBe("person_loitering");
  });

  it("does NOT start a new session if the person comes back inside the clearance window", () => {
    const cm = new CrimeMonitor({
      dwellMs: 100,
      cooldownMs: 0,
      oncePerSession: true,
      sessionClearMs: 1000,
      quietHoursEnabled: false,
    });
    cm.ingest([person()], 0, ctx);
    expect(cm.ingest([person()], 200, ctx)?.event_type).toBe("person_loitering");

    cm.ingest([], 300, ctx);
    cm.ingest([person()], 500, ctx); // came back inside clearance — same session
    cm.ingest([person()], 700, ctx);
    expect(cm.ingest([person()], 1500, ctx)).toBeNull();
  });
});

describe("CrimeMonitor — movement gate", () => {
  const staticPerson = (t: number, score = 0.9) => ({
    label: "person",
    score,
    bbox: [100, 100, 50, 80] as [number, number, number, number],
    _: t,
  });
  const movedPerson = (score = 0.9) => ({
    label: "person",
    score,
    bbox: [300, 100, 50, 80] as [number, number, number, number],
  });

  it("does NOT fire when requireMovement is on and person hasn't moved", () => {
    const cm = new CrimeMonitor({
      dwellMs: 100,
      cooldownMs: 0,
      requireMovement: true,
      movementThresholdPx: 50,
      quietHoursEnabled: false,
    });
    cm.ingest([staticPerson(0)], 0, ctx);
    cm.ingest([staticPerson(50)], 50, ctx);
    expect(cm.ingest([staticPerson(200)], 200, ctx)).toBeNull();
  });

  it("fires when the person has moved past the threshold", () => {
    const cm = new CrimeMonitor({
      dwellMs: 100,
      cooldownMs: 0,
      requireMovement: true,
      movementThresholdPx: 50,
      quietHoursEnabled: false,
    });
    cm.ingest([staticPerson(0)], 0, ctx);
    cm.ingest([movedPerson()], 50, ctx); // big jump
    expect(cm.ingest([movedPerson()], 200, ctx)?.event_type).toBe("person_loitering");
  });
});
