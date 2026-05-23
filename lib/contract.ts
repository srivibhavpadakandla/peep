/**
 * The locked event contract. All three agents — vision, orchestration, browser —
 * communicate exclusively through this shape. Do not add fields or change types
 * without coordinating across builders.
 */

export type EventType = "package_taken" | "package_arrived" | "person_loitering";

export interface CameraEvent {
  event_type: EventType;
  /** Unix epoch milliseconds. */
  timestamp: number;
  /** Confidence in [0, 1]. Detector-defined; downstream agents may gate on this. */
  confidence: number;
  /**
   * Reference to a recorded clip of the event. In this implementation, a Blob URL
   * created in the browser via MediaRecorder. Treated opaquely by orchestration.
   */
  evidence_clip: EvidenceClipRef;
}

export interface EvidenceClipRef {
  /** Opaque URL. May be a blob:, https:, or file: URL depending on transport. */
  url: string;
  /** Clip duration in milliseconds. */
  duration_ms: number;
  /** MIME type, e.g. "video/webm". */
  mime_type: string;
}

export function isCameraEvent(value: unknown): value is CameraEvent {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.event_type !== "string") return false;
  if (typeof v.timestamp !== "number") return false;
  if (typeof v.confidence !== "number") return false;
  if (v.confidence < 0 || v.confidence > 1) return false;
  const clip = v.evidence_clip as Record<string, unknown> | null | undefined;
  if (!clip || typeof clip !== "object") return false;
  if (typeof clip.url !== "string") return false;
  if (typeof clip.duration_ms !== "number") return false;
  if (typeof clip.mime_type !== "string") return false;
  return true;
}
