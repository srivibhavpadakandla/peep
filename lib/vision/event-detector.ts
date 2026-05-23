import type { CameraEvent, EvidenceClipRef } from "../contract";
import type { Detection } from "./detector";

/**
 * Pure state machine. Given a stream of per-frame detections, emit contract events.
 *
 * Trigger for "package_taken":
 *   1. A target object (e.g. "backpack") is present and stable for `stableMs`.
 *   2. The same object disappears for `absentMs` consecutive frames.
 *   -> emit { event_type: "package_taken", confidence: stability * persistence }.
 *
 * Stateless w.r.t. the camera and DOM — testable with synthetic detection streams.
 */

export interface EventDetectorOptions {
  /** COCO-SSD class label that represents "the package". */
  targetLabel: string;
  /** Minimum per-frame confidence to count an object as present. */
  minScore: number;
  /** How long the target must persist before it's "tracked". */
  stableMs: number;
  /** How long absence must last before "taken" fires. */
  absentMs: number;
  /** Min cooldown between consecutive emissions. */
  cooldownMs: number;
}

export const DEFAULT_OPTIONS: EventDetectorOptions = {
  targetLabel: "backpack",
  minScore: 0.5,
  stableMs: 800,
  absentMs: 500,
  cooldownMs: 5000,
};

type Phase = "waiting" | "tracking" | "absent" | "cooldown";

export class EventDetector {
  private opts: EventDetectorOptions;
  private phase: Phase = "waiting";
  private trackedSince = 0;
  private absentSince = 0;
  private lastEmit = 0;
  private lastScore = 0;

  constructor(options: Partial<EventDetectorOptions> = {}) {
    this.opts = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Feed in one frame's detections at `now`. Returns the event_type to emit,
   * or null. Stays pure: caller is responsible for attaching timestamp +
   * evidence_clip and dispatching downstream.
   */
  ingest(detections: Detection[], now: number): EventDecision | null {
    const target = this.bestMatch(detections);
    const present = target !== null && target.score >= this.opts.minScore;

    switch (this.phase) {
      case "waiting": {
        if (present) {
          this.phase = "tracking";
          this.trackedSince = now;
          this.lastScore = target!.score;
        }
        return null;
      }
      case "tracking": {
        if (present) {
          this.lastScore = Math.max(this.lastScore, target!.score);
          return null;
        }
        if (now - this.trackedSince < this.opts.stableMs) {
          // Object wasn't stable long enough — false start.
          this.phase = "waiting";
          return null;
        }
        this.phase = "absent";
        this.absentSince = now;
        return null;
      }
      case "absent": {
        if (present) {
          // Came back — keep tracking.
          this.phase = "tracking";
          return null;
        }
        if (now - this.absentSince >= this.opts.absentMs) {
          if (this.lastEmit > 0 && now - this.lastEmit < this.opts.cooldownMs) {
            this.phase = "cooldown";
            return null;
          }
          this.lastEmit = now;
          this.phase = "cooldown";
          const persistenceFactor = Math.min(1, (this.absentSince - this.trackedSince) / (this.opts.stableMs * 2));
          const confidence = clamp01(this.lastScore * (0.5 + 0.5 * persistenceFactor));
          return { event_type: "package_taken", confidence };
        }
        return null;
      }
      case "cooldown": {
        if (now - this.lastEmit >= this.opts.cooldownMs) {
          this.phase = "waiting";
        }
        return null;
      }
    }
  }

  reset(): void {
    this.phase = "waiting";
    this.trackedSince = 0;
    this.absentSince = 0;
    this.lastEmit = 0;
    this.lastScore = 0;
  }

  /** For UI/debug. */
  getPhase(): Phase {
    return this.phase;
  }

  private bestMatch(detections: Detection[]): Detection | null {
    let best: Detection | null = null;
    for (const d of detections) {
      if (d.label !== this.opts.targetLabel) continue;
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

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
