"use client";

import { useState } from "react";
import { useAgentStore } from "@/lib/store";
import type { CameraEvent, EventType } from "@/lib/contract";

const EVENT_TYPES: EventType[] = [
  "person_loitering",
  "multiple_loitering",
  "after_hours_activity",
  "weapon_detected",
  "package_taken",
  "package_arrived",
  "package_not_arrived",
  "animal_detected",
];

interface Preset {
  label: string;
  description: string;
  emoji: string;
  build: () => CameraEvent;
}

function syntheticClip(label: string): CameraEvent["evidence_clip"] {
  return { url: `synthetic://${label}/${Date.now()}`, duration_ms: 5000, mime_type: "video/webm" };
}

const PRESETS: Preset[] = [
  {
    label: "Loitering · high conf",
    emoji: "🚶",
    description: "Should pass reasoning → trigger email",
    build: () => ({
      event_type: "person_loitering",
      timestamp: Date.now(),
      confidence: 0.86,
      evidence_clip: syntheticClip("loiter-high"),
    }),
  },
  {
    label: "Loitering · low conf",
    emoji: "🌫",
    description: "Below 0.5 confidence → orchestrator should drop",
    build: () => ({
      event_type: "person_loitering",
      timestamp: Date.now(),
      confidence: 0.32,
      evidence_clip: syntheticClip("loiter-low"),
    }),
  },
  {
    label: "After-hours activity",
    emoji: "🌙",
    description: "Quiet-hours person → reason then email",
    build: () => ({
      event_type: "after_hours_activity",
      timestamp: Date.now(),
      confidence: 0.74,
      evidence_clip: syntheticClip("after-hours"),
    }),
  },
  {
    label: "Package taken",
    emoji: "📦",
    description: "Routes to amazon_refund_claim",
    build: () => ({
      event_type: "package_taken",
      timestamp: Date.now(),
      confidence: 0.91,
      evidence_clip: syntheticClip("package-taken"),
    }),
  },
  {
    label: "Animal detected",
    emoji: "🐕",
    description: "Routes to send_security_email",
    build: () => ({
      event_type: "animal_detected",
      timestamp: Date.now(),
      confidence: 0.78,
      evidence_clip: syntheticClip("animal"),
    }),
  },
  {
    label: "Flicker burst",
    emoji: "⚡",
    description: "3 rapid loitering events → reasoning marks false_positive",
    build: () => ({
      event_type: "multiple_loitering",
      timestamp: Date.now(),
      confidence: 0.72,
      evidence_clip: syntheticClip("flicker"),
    }),
  },
];

export default function EventLauncher() {
  const publishEvent = useAgentStore((s) => s.publishEvent);
  const appendLog = useAgentStore((s) => s.appendLog);
  const lastEvent = useAgentStore((s) => s.lastEvent);
  const [open, setOpen] = useState(false);
  const [eventType, setEventType] = useState<EventType>("person_loitering");
  const [confidence, setConfidence] = useState(0.8);
  const [editError, setEditError] = useState<string | null>(null);

  const fire = (event: CameraEvent, label: string) => {
    publishEvent(event);
    appendLog({
      source: "system",
      level: "info",
      message: `synthetic event fired: ${label} (${event.event_type}, conf ${event.confidence.toFixed(2)})`,
    });
  };

  const firePreset = (preset: Preset) => {
    if (preset.label !== "Flicker burst") {
      fire(preset.build(), preset.label);
      return;
    }
    // Flicker burst: 3 events 1.5s apart so reasoning sees a flicker pattern.
    for (let i = 0; i < 3; i++) {
      setTimeout(() => fire(preset.build(), `${preset.label} ${i + 1}/3`), i * 1500);
    }
  };

  const fireFromEditor = () => {
    setEditError(null);
    if (confidence < 0 || confidence > 1) {
      setEditError("confidence must be between 0 and 1");
      return;
    }
    fire(
      {
        event_type: eventType,
        timestamp: Date.now(),
        confidence,
        evidence_clip: syntheticClip("editor"),
      },
      `editor: ${eventType}`,
    );
  };

  return (
    <section className="bg-[#171716] border border-[#2C2C2A] p-4 rounded-none space-y-3">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">
            Test Event Launcher
          </h2>
          <p className="text-[11px] text-[#8C8C85] font-mono mt-0.5">
            Fire synthetic CameraEvents to exercise the pipeline without the real camera.
          </p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-[10px] font-mono uppercase tracking-wider text-[#8C8C85] hover:text-[#D2E7C9] px-2 py-1 border border-[#2C2C2A] hover:border-[#525D44]/40 transition-colors"
        >
          {open ? "Hide editor" : "Edit & fire"}
        </button>
      </header>

      {/* Preset grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => firePreset(p)}
            className="group text-left bg-[#0A0A0A] border border-[#2C2C2A] hover:border-[#525D44]/60 hover:bg-[#1C1C1B] p-2.5 transition-all rounded-none"
            title={p.description}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{p.emoji}</span>
              <span className="text-[11px] font-mono font-bold text-[#E6E6E0] group-hover:text-[#D2E7C9]">
                {p.label}
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#8C8C85] leading-tight">{p.description}</p>
          </button>
        ))}
      </div>

      {/* Edit-and-fire editor */}
      {open && (
        <div className="bg-[#0A0A0A] border border-[#2C2C2A] p-3 space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <label className="text-[#8C8C85] w-24">event_type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as EventType)}
              className="bg-[#171716] border border-[#2C2C2A] text-[#E6E6E0] text-[11px] font-mono px-2 py-1 flex-1"
            >
              {EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono">
            <label className="text-[#8C8C85] w-24">confidence</label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="flex-1 accent-emerald-500"
            />
            <span className="text-[#D2E7C9] tabular-nums w-12 text-right">{confidence.toFixed(2)}</span>
          </div>
          {lastEvent && (
            <p className="text-[10px] font-mono text-[#5C5C59]">
              Last fired: {lastEvent.event_type} @ {new Date(lastEvent.timestamp).toLocaleTimeString()} ·
              conf {lastEvent.confidence.toFixed(2)}
            </p>
          )}
          {editError && <p className="text-[10px] font-mono text-red-400">{editError}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={fireFromEditor}
              className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 bg-emerald-950/40 border border-emerald-700 text-emerald-300 hover:bg-emerald-900/40"
            >
              Fire event
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
