import type { CameraEvent, EvidenceClipRef } from "../contract";
import type { Detection } from "./detector";

/**
 * Pure state machine modeling the full delivery → theft scenario.
 *
 *   idle ──[target appears]──▶ arriving ──[stable, person away]──▶ resting
 *                                                                     │
 *                                          [person near target]──┐    │
 *                                                                ▼    │
 *                                                              at_risk│
 *                                                                │  │ │
 *                            [target gone w/ recent approach]──┐ │  │ │
 *                                                              ▼ ▼  │ │
 *                                                           cooldown │ │
 *                                                              │     │ │
 *                                                              ▼     │ │
 *                                                            idle ◀──┴─┘
 *
 * Emissions (both conform to lib/contract.ts):
 *   - `package_arrived` on idle → arriving → resting transition.
 *   - `package_taken`   on resting/at_risk → cooldown when the target
 *     disappears while a person was near within `approachWindowMs`.
 *
 * Stateless w.r.t. the camera and DOM — testable with synthetic detection
 * streams. Caller is responsible for attaching evidence_clip and timestamp.
 */

export interface EventDetectorOptions {
  /** COCO-SSD class label that represents "the package". */
  targetLabel: string;
  /** COCO-SSD class label for a human actor. */
  personLabel: string;
  /** Minimum per-frame confidence to count a detection as present. */
  minScore: number;
  /** Target must be stably present this long before "arrived" can fire. */
  arrivalStableMs: number;
  /** Person must have been clear of the target this long before "arrived" can fire. */
  clearanceMs: number;
  /** Target absence this long while at-risk → emit package_taken. */
  absentMs: number;
  /** Person must have been near the target within this window of the disappearance. */
  approachWindowMs: number;
  /** Bbox proximity test: padding as a fraction of each bbox's larger dimension. */
  proximityFactor: number;
  /** Min interval between consecutive emissions (per event_type). */
  cooldownMs: number;
}

export const DEFAULT_OPTIONS: EventDetectorOptions = {
  targetLabel: "backpack",
  personLabel: "person",
  minScore: 0.5,
  arrivalStableMs: 1000,
  clearanceMs: 1500,
  absentMs: 500,
  approachWindowMs: 3000,
  proximityFactor: 0.5,
  cooldownMs: 5000,
};

export type Phase = "idle" | "arriving" | "resting" | "at_risk" | "cooldown";

export interface EventDetectorState {
  phase: Phase;
  personPresent: boolean;
  personNearTarget: boolean;
}

type Bbox = [number, number, number, number];

export class EventDetector {
  private opts: EventDetectorOptions;
  private phase: Phase = "idle";
  private targetFirstSeenAt = 0;
  private lastTargetScore = 0;
  private lastTargetBbox: Bbox | null = null;
  private lastPersonNearAt = 0;
  private absentSince = 0;
  private lastEmitAt = 0;
  private _personPresent = false;
  private _personNearTarget = false;

  constructor(options: Partial<EventDetectorOptions> = {}) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
  }

  /** Feed in one frame's detections at `now`. Returns an emission or null. */
  ingest(detections: Detection[], now: number): EventDecision | null {
    const target = this.bestMatch(detections, this.opts.targetLabel);
    const targetPresent = target !== null && target.score >= this.opts.minScore;

    const people = detections.filter(
      (d) => d.label === this.opts.personLabel && d.score >= this.opts.minScore,
    );
    this._personPresent = people.length > 0;

    const referenceBbox = targetPresent ? target!.bbox : this.lastTargetBbox;
    this._personNearTarget =
      referenceBbox !== null &&
      people.some((p) => bboxesNear(referenceBbox!, p.bbox, this.opts.proximityFactor));
    if (this._personNearTarget) this.lastPersonNearAt = now;

    if (targetPresent) {
      this.lastTargetBbox = target!.bbox;
      this.lastTargetScore = Math.max(this.lastTargetScore, target!.score);
    }

    switch (this.phase) {
      case "idle":
        if (targetPresent) {
          this.phase = "arriving";
          this.targetFirstSeenAt = now;
          this.lastTargetScore = target!.score;
        }
        return null;

      case "arriving": {
        if (!targetPresent) {
          // Target flickered out before delivery confirmed — false start.
          this.softReset();
          return null;
        }
        const stableEnough = now - this.targetFirstSeenAt >= this.opts.arrivalStableMs;
        const sinceNear = this.lastPersonNearAt === 0 ? Infinity : now - this.lastPersonNearAt;
        const cleared = sinceNear >= this.opts.clearanceMs;
        if (stableEnough && cleared) {
          this.phase = "resting";
          // Arrival is not cooldown-gated: a re-delivery after a benign
          // disappearance is a legitimate new event.
          return { event_type: "package_arrived", confidence: clamp01(this.lastTargetScore) };
        }
        return null;
      }

      case "resting": {
        if (this._personNearTarget) {
          this.phase = "at_risk";
          return null;
        }
        if (!targetPresent) {
          this.absentSince = now;
          // Look back: if there was a recent approach, this could be a fast grab.
          const decision = this.tryEmitTheft(now);
          if (decision) return decision;
          // Benign disappearance — owner moved it off-camera, detector flicker.
          this.softReset();
        }
        return null;
      }

      case "at_risk": {
        if (targetPresent) {
          if (!this._personNearTarget) {
            // Person left the area, package is fine — back to resting.
            this.phase = "resting";
          }
          return null;
        }
        if (this.absentSince === 0) this.absentSince = now;
        if (now - this.absentSince >= this.opts.absentMs) {
          const decision = this.tryEmitTheft(now);
          if (decision) return decision;
          this.softReset();
        }
        return null;
      }

      case "cooldown":
        if (now - this.lastEmitAt >= this.opts.cooldownMs) this.softReset();
        return null;
    }
  }

  reset(): void {
    this.phase = "idle";
    this.targetFirstSeenAt = 0;
    this.lastTargetScore = 0;
    this.lastTargetBbox = null;
    this.lastPersonNearAt = 0;
    this.absentSince = 0;
    this.lastEmitAt = 0;
    this._personPresent = false;
    this._personNearTarget = false;
  }

  getState(): EventDetectorState {
    return {
      phase: this.phase,
      personPresent: this._personPresent,
      personNearTarget: this._personNearTarget,
    };
  }

  getPhase(): Phase {
    return this.phase;
  }

  private tryEmitTheft(now: number): EventDecision | null {
    const sinceApproach =
      this.lastPersonNearAt === 0 ? Infinity : now - this.lastPersonNearAt;
    if (sinceApproach > this.opts.approachWindowMs) return null;
    if (!this.canEmit(now)) return null;
    this.lastEmitAt = now;
    this.phase = "cooldown";
    const recency = 1 - sinceApproach / this.opts.approachWindowMs;
    const confidence = clamp01(this.lastTargetScore * (0.5 + 0.5 * recency));
    return { event_type: "package_taken", confidence };
  }

  private canEmit(now: number): boolean {
    if (this.lastEmitAt === 0) return true;
    return now - this.lastEmitAt >= this.opts.cooldownMs;
  }

  /** Clears in-flight tracking but preserves lastEmitAt (so cooldown survives). */
  private softReset(): void {
    this.phase = "idle";
    this.targetFirstSeenAt = 0;
    this.lastTargetScore = 0;
    this.lastTargetBbox = null;
    this.lastPersonNearAt = 0;
    this.absentSince = 0;
  }

  private bestMatch(detections: Detection[], label: string): Detection | null {
    let best: Detection | null = null;
    for (const d of detections) {
      if (d.label !== label) continue;
      if (!best || d.score > best.score) best = d;
    }
    return best;
  }
}

export interface EventDecision {
  event_type: CameraEvent["event_type"];
  confidence: number;
}

export function buildEvent(decision: EventDecision, clip: EvidenceClipRef, now: number): CameraEvent {
  return {
    event_type: decision.event_type,
    timestamp: now,
    confidence: decision.confidence,
    evidence_clip: clip,
  };
}

/** Two bboxes are "near" if they overlap once each is padded by paddingFactor of its larger dim. */
export function bboxesNear(a: Bbox, b: Bbox, paddingFactor: number): boolean {
  const pa = Math.max(a[2], a[3]) * paddingFactor;
  const pb = Math.max(b[2], b[3]) * paddingFactor;
  return !(
    a[0] + a[2] + pa < b[0] - pb ||
    b[0] + b[2] + pb < a[0] - pa ||
    a[1] + a[3] + pa < b[1] - pb ||
    b[1] + b[3] + pb < a[1] - pa
  );
}

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
