import type { EventType } from "../contract";
import type { Detection } from "./detector";

/**
 * Pure state machine for crime signals not tied to the package state machine.
 * Runs alongside EventDetector; ingests the same per-frame detections plus a
 * small contextual hint about package interaction (so loitering doesn't fire
 * while a person is legitimately interacting with the package).
 *
 * Emissions (one per frame, priority order):
 *   weapon_detected   > after_hours_activity > multiple_loitering > person_loitering
 */

export interface CrimeMonitorOptions {
  /** Master kill switch. When false, ingest() always returns null. */
  enabled: boolean;
  personLabel: string;
  weaponLabels: string[];
  minScore: number;
  weaponMinScore: number;
  /** Person must be in frame, not interacting with package, for this long. */
  dwellMs: number;
  /** ≥ this many people simultaneously → multiple_loitering instead. */
  multiCount: number;
  /** Hours (0–23) — start of the "quiet hours" window. */
  quietHoursStart: number;
  /** Hours (0–23) — end of the "quiet hours" window. Wraps midnight if end ≤ start. */
  quietHoursEnd: number;
  /** Whether the quiet-hours signal is enabled at all. */
  quietHoursEnabled: boolean;
  /** Min interval between repeat emissions of the same event_type. */
  cooldownMs: number;
  /**
   * If true, each loitering session fires at most one alert per event_type.
   * A session ends when no loitering is observed for `sessionClearMs`.
   */
  oncePerSession: boolean;
  sessionClearMs: number;
  /**
   * If true, require the highest-confidence person's bbox center to move at
   * least `movementThresholdPx` pixels (from where they were when loitering
   * started) before any loiter alert can fire.
   */
  requireMovement: boolean;
  movementThresholdPx: number;
}

export const DEFAULT_OPTIONS: CrimeMonitorOptions = {
  enabled: true,
  personLabel: "person",
  weaponLabels: ["knife", "scissors", "baseball bat"],
  minScore: 0.5,
  weaponMinScore: 0.55,
  dwellMs: 5000,
  multiCount: 2,
  quietHoursStart: 22,
  quietHoursEnd: 5,
  quietHoursEnabled: true,
  cooldownMs: 10000,
  oncePerSession: false,
  sessionClearMs: 10000,
  requireMovement: false,
  movementThresholdPx: 60,
};

export interface CrimeDecision {
  event_type: Extract<
    EventType,
    "person_loitering" | "multiple_loitering" | "weapon_detected" | "after_hours_activity"
  >;
  confidence: number;
  meta: { person_count: number; weapon_labels?: string[]; movement_px?: number };
}

export interface CrimeMonitorState {
  loiteringDwellMs: number;
  personCount: number;
  weaponPresent: boolean;
  inQuietHours: boolean;
  movementPx: number;
  sessionState: SessionState;
}

type Bbox = [number, number, number, number];
type SessionState = "none" | "active" | "gap";

export class CrimeMonitor {
  private opts: CrimeMonitorOptions;
  private loiteringSince: number | null = null;
  private lastEmit: Partial<Record<CrimeDecision["event_type"], number>> = {};
  private sessionFiredTypes: Set<CrimeDecision["event_type"]> = new Set();
  private sessionState: SessionState = "none";
  private gapStartedAt = 0;
  private loiterStartCenter: { x: number; y: number } | null = null;
  private maxMovementPx = 0;
  private _state: CrimeMonitorState = {
    loiteringDwellMs: 0,
    personCount: 0,
    weaponPresent: false,
    inQuietHours: false,
    movementPx: 0,
    sessionState: "none",
  };

  constructor(options: Partial<CrimeMonitorOptions> = {}) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
  }

  setOptions(options: Partial<CrimeMonitorOptions>) {
    this.opts = { ...this.opts, ...options };
  }

  ingest(
    detections: Detection[],
    now: number,
    ctx: { personNearTarget: boolean },
  ): CrimeDecision | null {
    if (!this.opts.enabled) {
      this._state = {
        loiteringDwellMs: 0,
        personCount: 0,
        weaponPresent: false,
        inQuietHours: false,
        movementPx: 0,
        sessionState: "none",
      };
      return null;
    }

    const people = detections.filter(
      (d) => d.label === this.opts.personLabel && d.score >= this.opts.minScore,
    );
    const weapons = detections.filter(
      (d) =>
        this.opts.weaponLabels.includes(d.label) && d.score >= this.opts.weaponMinScore,
    );

    const quiet = this.opts.quietHoursEnabled && isInQuietHours(now, this.opts);
    const loiteringActive = people.length > 0 && !ctx.personNearTarget;

    this.updateSession(loiteringActive, now);
    this.updateLoiteringTimer(loiteringActive, now);
    this.updateMovementTracking(people, loiteringActive);

    const dwellMs = this.loiteringSince === null ? 0 : now - this.loiteringSince;

    this._state = {
      loiteringDwellMs: dwellMs,
      personCount: people.length,
      weaponPresent: weapons.length > 0,
      inQuietHours: quiet,
      movementPx: Math.round(this.maxMovementPx),
      sessionState: this.sessionState,
    };

    // Priority 1 — weapon present
    if (weapons.length > 0 && this.canEmit("weapon_detected", now)) {
      this.recordEmit("weapon_detected", now);
      const top = weapons.reduce((m, d) => (d.score > m.score ? d : m), weapons[0]);
      return {
        event_type: "weapon_detected",
        confidence: top.score,
        meta: { person_count: people.length, weapon_labels: weapons.map((w) => w.label) },
      };
    }

    // Priority 2 — after-hours person presence
    if (quiet && people.length > 0 && this.canEmit("after_hours_activity", now)) {
      this.recordEmit("after_hours_activity", now);
      const top = people.reduce((m, d) => (d.score > m.score ? d : m), people[0]);
      return {
        event_type: "after_hours_activity",
        confidence: top.score,
        meta: { person_count: people.length },
      };
    }

    // Priorities 3 / 4 — loitering. Gated by dwell, cooldown/session, and (optionally) movement.
    if (loiteringActive && dwellMs >= this.opts.dwellMs && this.movementGatePassed()) {
      if (people.length >= this.opts.multiCount && this.canEmit("multiple_loitering", now)) {
        this.recordEmit("multiple_loitering", now);
        const avg = people.reduce((s, d) => s + d.score, 0) / people.length;
        return {
          event_type: "multiple_loitering",
          confidence: clamp01(avg),
          meta: { person_count: people.length, movement_px: Math.round(this.maxMovementPx) },
        };
      }
      if (people.length === 1 && this.canEmit("person_loitering", now)) {
        this.recordEmit("person_loitering", now);
        return {
          event_type: "person_loitering",
          confidence: people[0].score,
          meta: { person_count: 1, movement_px: Math.round(this.maxMovementPx) },
        };
      }
    }

    return null;
  }

  getState(): CrimeMonitorState {
    return this._state;
  }

  reset() {
    this.loiteringSince = null;
    this.lastEmit = {};
    this.sessionFiredTypes.clear();
    this.sessionState = "none";
    this.gapStartedAt = 0;
    this.loiterStartCenter = null;
    this.maxMovementPx = 0;
    this._state = {
      loiteringDwellMs: 0,
      personCount: 0,
      weaponPresent: false,
      inQuietHours: false,
      movementPx: 0,
      sessionState: "none",
    };
  }

  private updateSession(loiteringActive: boolean, now: number) {
    if (loiteringActive) {
      if (this.sessionState === "none") {
        this.sessionState = "active";
        this.sessionFiredTypes.clear();
      } else if (this.sessionState === "gap") {
        // Came back inside the clearance window — continue the same session.
        this.sessionState = "active";
      }
    } else {
      if (this.sessionState === "active") {
        this.sessionState = "gap";
        this.gapStartedAt = now;
      } else if (this.sessionState === "gap") {
        if (now - this.gapStartedAt >= this.opts.sessionClearMs) {
          this.sessionState = "none";
        }
      }
    }
  }

  private updateLoiteringTimer(loiteringActive: boolean, now: number) {
    if (loiteringActive) {
      if (this.loiteringSince === null) this.loiteringSince = now;
    } else {
      this.loiteringSince = null;
    }
  }

  private updateMovementTracking(people: Detection[], loiteringActive: boolean) {
    if (!loiteringActive || people.length === 0) {
      if (this.loiteringSince === null) {
        this.loiterStartCenter = null;
        this.maxMovementPx = 0;
      }
      return;
    }
    const top = people.reduce((m, d) => (d.score > m.score ? d : m), people[0]);
    const center = bboxCenter(top.bbox);
    if (this.loiterStartCenter === null) {
      this.loiterStartCenter = center;
      this.maxMovementPx = 0;
      return;
    }
    const dist = Math.hypot(center.x - this.loiterStartCenter.x, center.y - this.loiterStartCenter.y);
    if (dist > this.maxMovementPx) this.maxMovementPx = dist;
  }

  private movementGatePassed(): boolean {
    if (!this.opts.requireMovement) return true;
    return this.maxMovementPx >= this.opts.movementThresholdPx;
  }

  private canEmit(type: CrimeDecision["event_type"], now: number): boolean {
    if (this.opts.oncePerSession && (type === "person_loitering" || type === "multiple_loitering")) {
      if (this.sessionFiredTypes.has(type)) return false;
      return true;
    }
    const last = this.lastEmit[type] ?? 0;
    return now - last >= this.opts.cooldownMs;
  }

  private recordEmit(type: CrimeDecision["event_type"], now: number) {
    this.lastEmit[type] = now;
    this.sessionFiredTypes.add(type);
  }
}

export function isInQuietHours(
  now: number,
  opts: Pick<CrimeMonitorOptions, "quietHoursStart" | "quietHoursEnd">,
): boolean {
  const hour = new Date(now).getHours();
  const { quietHoursStart: s, quietHoursEnd: e } = opts;
  if (s === e) return false;
  if (s < e) return hour >= s && hour < e;
  return hour >= s || hour < e;
}

function bboxCenter(b: Bbox): { x: number; y: number } {
  return { x: b[0] + b[2] / 2, y: b[1] + b[3] / 2 };
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
