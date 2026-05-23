"use client";

import type { EvidenceClipRef } from "../contract";

/**
 * Rolling MediaRecorder buffer. Captures the last N seconds continuously and,
 * on demand, finalizes a clip and returns an EvidenceClipRef pointing at a
 * blob: URL in the current document.
 */
export class ClipRecorder {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private mimeType = "";
  private windowMs: number;
  private chunkMs: number;

  constructor(stream: MediaStream, windowMs = 5000, chunkMs = 250) {
    this.windowMs = windowMs;
    this.chunkMs = chunkMs;
    this.mimeType = pickMimeType();
    this.recorder = new MediaRecorder(stream, { mimeType: this.mimeType });
    this.recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.chunks.push(e.data);
        this.trimChunks();
      }
    };
  }

  start() {
    if (!this.recorder) return;
    if (this.recorder.state !== "inactive") return;
    this.recorder.start(this.chunkMs);
  }

  stop() {
    if (!this.recorder) return;
    if (this.recorder.state !== "inactive") this.recorder.stop();
  }

  /**
   * Finalize a clip from the rolling buffer. Returns a Blob URL the caller owns
   * — release with URL.revokeObjectURL when done.
   */
  finalize(): EvidenceClipRef {
    const blob = new Blob(this.chunks.slice(), { type: this.mimeType });
    const url = URL.createObjectURL(blob);
    return {
      url,
      duration_ms: Math.min(this.windowMs, this.chunks.length * this.chunkMs),
      mime_type: this.mimeType,
    };
  }

  private trimChunks() {
    const maxChunks = Math.ceil(this.windowMs / this.chunkMs);
    if (this.chunks.length > maxChunks) {
      this.chunks.splice(0, this.chunks.length - maxChunks);
    }
  }
}

function pickMimeType(): string {
  const candidates = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "video/webm";
}
