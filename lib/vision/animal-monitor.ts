import type { EventType } from "../contract";
import type { Detection } from "./detector";

/**
 * Per-frame animal detector with per-label session state. Smaller and simpler
 * than CrimeMonitor: no dwell time, no movement gate — animals that walk
 * through frame should be reported promptly. Same cooldown / fire-once-per-
 * session semantics, applied independently per animal label so a dog and a
 * bear in the same frame both register.
 */

export interface AnimalMonitorOptions {
  enabled: boolean;
  /** COCO-SSD class names to treat as "animal of interest". */
  animalLabels: string[];
  minScore: number;
  cooldownMs: number;
  oncePerSession: boolean;
  /** Absent this long before a new session begins (per label). */
  sessionClearMs: number;
}

export const DEFAULT_OPTIONS: AnimalMonitorOptions = {
  enabled: true,
  animalLabels: ["dog", "bear"],
  minScore: 0.55,
  cooldownMs: 60_000,
  oncePerSession: true,
  sessionClearMs: 15_000,
};

export interface AnimalDecision {
  event_type: Extract<EventType, "animal_detected">;
  confidence: number;
  meta: {
    animal: string;
    /** "high" for bear-class threats, "info" otherwise. */
    severity: "high" | "info";
    count: number;
  };
}

export interface AnimalMonitorState {
  /** Map: label → number of consecutive frames the animal has been seen. */
  seenNow: Record<string, number>;
}

type SessionState = "none" | "active" | "gap";

interface PerLabelState {
  session: SessionState;
  gapStartedAt: number;
  lastEmitAt: number;
  firedInSession: boolean;
}

export class AnimalMonitor {
  private opts: AnimalMonitorOptions;
  private states: Record<string, PerLabelState> = {};
  private _state: AnimalMonitorState = { seenNow: {} };

  constructor(options: Partial<AnimalMonitorOptions> = {}) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
  }

  setOptions(options: Partial<AnimalMonitorOptions>) {
    this.opts = { ...this.opts, ...options };
  }

  ingest(detections: Detection[], now: number): AnimalDecision | null {
    if (!this.opts.enabled) {
      this._state = { seenNow: {} };
      return null;
    }

    const seen: Record<string, Detection[]> = {};
    for (const label of this.opts.animalLabels) {
      seen[label] = detections.filter((d) => d.label === label && d.score >= this.opts.minScore);
    }
    this._state = { seenNow: Object.fromEntries(Object.entries(seen).map(([k, v]) => [k, v.length])) };

    // Update per-label session state, then check for emission. Bear before dog
    // (highest stakes first) so a frame with both yields the bear alert.
    const ordered = orderLabelsByPriority(this.opts.animalLabels);
    for (const label of ordered) {
      const ps = this.labelState(label);
      const present = seen[label].length > 0;
      this.updateLabelSession(ps, present, now);
      if (present && this.canEmit(ps, now)) {
        this.recordEmit(ps, now);
        const animals = seen[label];
        const top = animals.reduce((m, d) => (d.score > m.score ? d : m), animals[0]);
        return {
          event_type: "animal_detected",
          confidence: top.score,
          meta: {
            animal: label,
            severity: label === "bear" ? "high" : "info",
            count: animals.length,
          },
        };
      }
    }
    return null;
  }

  getState(): AnimalMonitorState {
    return this._state;
  }

  private labelState(label: string): PerLabelState {
    if (!this.states[label]) {
      this.states[label] = {
        session: "none",
        gapStartedAt: 0,
        lastEmitAt: Number.NEGATIVE_INFINITY,
        firedInSession: false,
      };
    }
    return this.states[label];
  }

  reset() {
    this.states = {};
    this._state = { seenNow: {} };
  }

  private updateLabelSession(ps: PerLabelState, present: boolean, now: number) {
    if (present) {
      if (ps.session === "none") {
        ps.session = "active";
        ps.firedInSession = false;
      } else if (ps.session === "gap") {
        ps.session = "active";
      }
    } else {
      if (ps.session === "active") {
        ps.session = "gap";
        ps.gapStartedAt = now;
      } else if (ps.session === "gap") {
        if (now - ps.gapStartedAt >= this.opts.sessionClearMs) {
          ps.session = "none";
        }
      }
    }
  }

  private canEmit(ps: PerLabelState, now: number): boolean {
    if (this.opts.oncePerSession) return !ps.firedInSession;
    return now - ps.lastEmitAt >= this.opts.cooldownMs;
  }

  private recordEmit(ps: PerLabelState, now: number) {
    ps.lastEmitAt = now;
    ps.firedInSession = true;
  }
}

function orderLabelsByPriority(labels: string[]): string[] {
  const priority = (l: string) => (l === "bear" ? 0 : 1);
  return labels.slice().sort((a, b) => priority(a) - priority(b));
}
