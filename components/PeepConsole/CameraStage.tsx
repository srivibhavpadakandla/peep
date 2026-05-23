"use client";

import { useEffect, useState } from "react";
import VisionAgent from "@/components/VisionAgent";
import type { CrimeConfig, AnimalConfig } from "@/components/SecurityAlertsPanel";
import { Pill, StatusDot } from "./primitives";

interface Props {
  targetLabel: string;
  source: "live" | "import";
  videoFile: File | null;
  crimeOptions: CrimeConfig;
  animalOptions: AnimalConfig;
}

/**
 * Wraps the real VisionAgent (live camera + COCO-SSD detection) in the
 * design's CCTV chrome — corner brackets, scanline, top-left LIVE pill,
 * top-right ticking clock, in-feed legend, and camera id.
 *
 * The grid/noise/house-silhouette backdrop is rendered as a fixed visual
 * layer behind the live video so the feed feels like a real CCTV view even
 * before the camera comes online.
 */
export default function CameraStage({
  targetLabel,
  source,
  videoFile,
  crimeOptions,
  animalOptions,
}: Props) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    setNow(new Date());
    return () => clearInterval(t);
  }, []);
  const timeStr = now ? now.toLocaleTimeString([], { hour12: false }) : "—";
  const dateStr = now ? now.toLocaleDateString([], { year: "numeric", month: "2-digit", day: "2-digit" }) : "—";

  const animalProps = {
    enabled: animalOptions.enabled,
    animalLabels: animalOptions.animalLabels,
    cooldownMs: animalOptions.cooldownMs,
    oncePerSession: animalOptions.oncePerSession,
  };

  return (
    <div
      className="relative w-full aspect-[16/9] bg-ink-950 rounded-xl overflow-hidden hairline"
      style={{ background: "linear-gradient(180deg, #0d0d0c 0%, #0a0a0a 60%, #070707 100%)" }}
    >
      {/* Atmospheric backdrop (sits behind everything) */}
      <div className="absolute inset-0 grid-bg opacity-90" />
      <div className="absolute inset-0 noise opacity-60" />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 25%, rgba(255,240,200,0.05) 0%, transparent 55%)" }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)" }}
      />

      {/* The real camera + detection canvas */}
      <div className="absolute inset-0 [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_canvas]:w-full [&_canvas]:h-full">
        <VisionAgent
          key={`${targetLabel}-${videoFile?.name ?? source}`}
          targetLabel={targetLabel}
          crimeOptions={crimeOptions}
          animalOptions={animalProps}
          videoSource={videoFile ?? "live"}
        />
      </div>

      {/* Scanline */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute left-0 right-0 h-px animate-scanline"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(16,185,129,0.55), transparent)",
            boxShadow: "0 0 22px 2px rgba(16,185,129,0.35)",
          }}
        />
      </div>

      {/* Center crosshair reticle */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
        <div className="relative w-4 h-4">
          <div className="absolute left-1/2 -top-1 w-px h-2 bg-ink-200" />
          <div className="absolute left-1/2 -bottom-1 w-px h-2 bg-ink-200" />
          <div className="absolute top-1/2 -left-1 h-px w-2 bg-ink-200" />
          <div className="absolute top-1/2 -right-1 h-px w-2 bg-ink-200" />
        </div>
      </div>

      {/* Corner brackets */}
      <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-em/50 pointer-events-none" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-em/50 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-em/50 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-em/50 pointer-events-none" />

      {/* Top-left source pill */}
      <div className="absolute top-3 left-3 flex items-center gap-2 z-10 pointer-events-none">
        <Pill color="#10b981">
          <StatusDot color="#10b981" pulse />
          {source === "live" ? "LIVE · 1080p · 12 fps" : "IMPORTED VIDEO"}
        </Pill>
        <Pill color="#9a9a96">REC</Pill>
      </div>

      {/* Top-right CCTV clock */}
      <div className="absolute top-3 right-3 text-right z-10 pointer-events-none">
        <div
          className="font-mono text-[11px] text-ink-100 leading-tight tabular-nums"
          style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
        >
          {timeStr}
        </div>
        <div
          className="font-mono text-[10px] text-ink-300 tabular-nums"
          style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
        >
          {dateStr}
        </div>
      </div>

      {/* In-feed detection legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3 px-2.5 py-1.5 rounded-md bg-black/50 backdrop-blur-sm hairline z-10 pointer-events-none">
        {(
          [
            ["person", "#10b981"],
            ["package", "#38bdf8"],
            ["weapon", "#ef4444"],
            ["animal", "#fbbf24"],
          ] as const
        ).map(([l, c]) => (
          <span
            key={l}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink-200"
          >
            <span className="w-2 h-2 rounded-sm" style={{ background: c }} />
            {l}
          </span>
        ))}
      </div>

      {/* Bottom-right camera id */}
      <div
        className="absolute bottom-3 right-3 font-mono text-[10px] text-ink-300/70 tabular-nums z-10 pointer-events-none"
        style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
      >
        cam_01 · front_door
      </div>
    </div>
  );
}
