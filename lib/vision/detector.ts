/**
 * Detector abstraction. Implementations: COCO-SSD (default, TFJS) and YOLOv8
 * (ONNX, optional). The event-detector state machine treats both identically.
 */

export interface Detection {
  /** Class label, e.g. "backpack". */
  label: string;
  /** Confidence in [0, 1]. */
  score: number;
  /** Bounding box in pixel coordinates of the source frame. [x, y, w, h]. */
  bbox: [number, number, number, number];
}

export interface Detector {
  /** One-time async setup. */
  load(): Promise<void>;
  /** Run inference on a frame. Source is anything drawable. */
  detect(frame: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): Promise<Detection[]>;
  /** Free resources. */
  dispose?(): void;
}
