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
  /** Hours (0–23) — end of the "quiet hours" window. Range wraps midnight if end ≤ start. */
  quietHoursEnd: number;
  /** Whether the quiet-hours signal is enabled at all. */
  quietHoursEnabled: boolean;
  /** Min interval between emissions of the same event_type. */
  cooldownMs: number;
}

export const DEFAULT_OPTIONS: CrimeMonitorOptions = {
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
};

export interface CrimeDecision {
  event_type: Extract<
    EventType,
    "person_loitering" | "multiple_loitering" | "weapon_detected" | "after_hours_activity"
  >;
  confidence: number;
  /** Useful context for downstream agents / UI. */
  meta: { person_count: number; weapon_labels?: string[] };
}

export interface CrimeMonitorState {
  loiteringDwellMs: number;
  personCount: number;
  weaponPresent: boolean;
  inQuietHours: boolean;
}

export class CrimeMonitor {
  private opts: CrimeMonitorOptions;
  private loiteringSince: number | null = null;
  private lastEmit: Partial<Record<CrimeDecision["event_type"], number>> = {};
  private _state: CrimeMonitorState = {
    loiteringDwellMs: 0,
    personCount: 0,
    weaponPresent: false,
    inQuietHours: false,
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
    const people = detections.filter(
      (d) => d.label === this.opts.personLabel && d.score >= this.opts.minScore,
    );
    const weapons = detections.filter(
      (d) =>
        this.opts.weaponLabels.includes(d.label) && d.score >= this.opts.weaponMinScore,
    );

    const quiet = this.opts.quietHoursEnabled && isInQuietHours(now, this.opts);

    // Loitering = person present, not currently interacting with the package.
    const loiteringActive = people.length > 0 && !ctx.personNearTarget;
    if (loiteringActive) {
      if (this.loiteringSince === null) this.loiteringSince = now;
    } else {
      this.loiteringSince = null;
    }
    const dwellMs = this.loiteringSince === null ? 0 : now - this.loiteringSince;

    this._state = {
      loiteringDwellMs: dwellMs,
      personCount: people.length,
      weaponPresent: weapons.length > 0,
      inQuietHours: quiet,
    };

    // Priority 1 — weapon present
    if (weapons.length > 0 && this.canEmit("weapon_detected", now)) {
      this.lastEmit.weapon_detected = now;
      const top = weapons.reduce((m, d) => (d.score > m.score ? d : m), weapons[0]);
      return {
        event_type: "weapon_detected",
        confidence: top.score,
        meta: { person_count: people.length, weapon_labels: weapons.map((w) => w.label) },
      };
    }

    // Priority 2 — after-hours person presence
    if (quiet && people.length > 0 && this.canEmit("after_hours_activity", now)) {
      this.lastEmit.after_hours_activity = now;
      const top = people.reduce((m, d) => (d.score > m.score ? d : m), people[0]);
      return {
        event_type: "after_hours_activity",
        confidence: top.score,
        meta: { person_count: people.length },
      };
    }

    // Priorities 3 / 4 — loitering
    if (loiteringActive && dwellMs >= this.opts.dwellMs) {
      if (people.length >= this.opts.multiCount && this.canEmit("multiple_loitering", now)) {
        this.lastEmit.multiple_loitering = now;
        const avg = people.reduce((s, d) => s + d.score, 0) / people.length;
        return {
          event_type: "multiple_loitering",
          confidence: clamp01(avg),
          meta: { person_count: people.length },
        };
      }
      if (people.length === 1 && this.canEmit("person_loitering", now)) {
        this.lastEmit.person_loitering = now;
        return {
          event_type: "person_loitering",
          confidence: people[0].score,
          meta: { person_count: 1 },
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
    this._state = { loiteringDwellMs: 0, personCount: 0, weaponPresent: false, inQuietHours: false };
  }

  private canEmit(type: CrimeDecision["event_type"], now: number): boolean {
    const last = this.lastEmit[type] ?? 0;
    return now - last >= this.opts.cooldownMs;
  }
}

export function isInQuietHours(
  now: number,
  opts: Pick<CrimeMonitorOptions, "quietHoursStart" | "quietHoursEnd">,
): boolean {
  const hour = new Date(now).getHours();
  const { quietHoursStart: s, quietHoursEnd: e } = opts;
  if (s === e) return false; // empty window
  if (s < e) return hour >= s && hour < e; // non-wrap, e.g. 9..17
  return hour >= s || hour < e; // wraps midnight, e.g. 22..5
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
