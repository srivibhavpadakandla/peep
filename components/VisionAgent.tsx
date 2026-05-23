"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import { CocoSsdDetector } from "@/lib/vision/coco-ssd-detector";
import { EventDetector, DEFAULT_OPTIONS, buildEvent } from "@/lib/vision/event-detector";
import { ClipRecorder } from "@/lib/vision/clip-recorder";
import type { Detector, Detection } from "@/lib/vision/detector";

interface Props {
  /** COCO-SSD class to treat as "the package". */
  targetLabel?: string;
  /** Allow consumers to swap in a mock detector for tests. */
  detectorFactory?: () => Detector;
}

export default function VisionAgent({ targetLabel = "backpack", detectorFactory }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<string>("waiting");
  const [detectedNow, setDetectedNow] = useState<Detection[]>([]);

  const publishEvent = useAgentStore((s) => s.publishEvent);
  const appendLog = useAgentStore((s) => s.appendLog);
  const setStatus = useAgentStore((s) => s.setStatus);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let recorder: ClipRecorder | null = null;
    let detector: Detector | null = null;
    let eventDetector = new EventDetector({ ...DEFAULT_OPTIONS, targetLabel });
    let rafId = 0;

    async function init() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 }, audio: false });
        if (cancelled) return;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();

        recorder = new ClipRecorder(stream);
        recorder.start();

        detector = detectorFactory ? detectorFactory() : new CocoSsdDetector();
        await detector.load();
        if (cancelled) return;
        setReady(true);
        setStatus("watching");
        appendLog({ source: "vision", level: "info", message: "vision agent online; target=" + targetLabel });

        const loop = async () => {
          if (cancelled || !detector || !video) return;
          const detections = await detector.detect(video);
          drawOverlay(canvasRef.current, video, detections, targetLabel);
          setDetectedNow(detections);
          const now = Date.now();
          const decision = eventDetector.ingest(detections, now);
          setPhase(eventDetector.getPhase());
          if (decision && recorder) {
            const clip = recorder.finalize();
            const event = buildEvent(decision, clip, now);
            publishEvent(event);
          }
          rafId = requestAnimationFrame(loop);
        };
        rafId = requestAnimationFrame(loop);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(msg);
        appendLog({ source: "vision", level: "error", message: msg });
      }
    }
    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      recorder?.stop();
      detector?.dispose?.();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [targetLabel, detectorFactory, publishEvent, appendLog, setStatus]);

  return (
    <div className="relative w-full max-w-[640px] rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
      <video ref={videoRef} className="block w-full" muted playsInline />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
      <div className="absolute top-2 left-2 flex gap-2 text-xs">
        <span className="px-2 py-1 rounded bg-black/70 border border-neutral-700">
          {ready ? "● online" : loadError ? "● error" : "● loading…"}
        </span>
        <span className="px-2 py-1 rounded bg-black/70 border border-neutral-700">
          target: <code>{targetLabel}</code>
        </span>
        <span className="px-2 py-1 rounded bg-black/70 border border-neutral-700">
          phase: <code>{phase}</code>
        </span>
      </div>
      {loadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4 text-center text-sm text-red-400">
          {loadError}
        </div>
      )}
      <div className="absolute bottom-2 left-2 right-2 text-[10px] font-mono text-neutral-400 truncate">
        {detectedNow
          .slice(0, 6)
          .map((d) => `${d.label}:${d.score.toFixed(2)}`)
          .join("  ")}
      </div>
    </div>
  );
}

function drawOverlay(
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  detections: Detection[],
  targetLabel: string,
) {
  if (!canvas) return;
  const w = video.videoWidth;
  const h = video.videoHeight;
  if (!w || !h) return;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, w, h);
  for (const d of detections) {
    const [x, y, bw, bh] = d.bbox;
    const isTarget = d.label === targetLabel;
    ctx.lineWidth = 2;
    ctx.strokeStyle = isTarget ? "#10b981" : "#737373";
    ctx.strokeRect(x, y, bw, bh);
    ctx.fillStyle = isTarget ? "#10b981" : "#737373";
    ctx.font = "14px ui-monospace, monospace";
    ctx.fillText(`${d.label} ${d.score.toFixed(2)}`, x + 4, y + 16);
  }
}
