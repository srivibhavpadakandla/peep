"use client";

import type { Detection, Detector } from "./detector";

/**
 * COCO-SSD via TFJS. Reliable in-browser default. Loaded lazily so it doesn't
 * bloat the server bundle.
 */
export class CocoSsdDetector implements Detector {
  private model: any | null = null;

  async load(): Promise<void> {
    if (this.model) return;
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    const cocoSsd = await import("@tensorflow-models/coco-ssd");
    this.model = await cocoSsd.load({ base: "lite_mobilenet_v2" });
  }

  async detect(frame: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement): Promise<Detection[]> {
    if (!this.model) throw new Error("CocoSsdDetector.load() must be awaited first");
    const predictions = await this.model.detect(frame);
    return predictions.map((p: any) => ({
      label: p.class,
      score: p.score,
      bbox: p.bbox as [number, number, number, number],
    }));
  }

  dispose() {
    this.model = null;
  }
}
