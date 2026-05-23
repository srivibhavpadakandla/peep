"use client";

import { useState } from "react";
import { icons } from "lucide-react";
import CameraStage from "../CameraStage";
import {
  Divider,
  Kbd,
  Mono,
  Pill,
  SectionLabel,
  SeverityChip,
  StatusDot,
  Surface,
} from "../primitives";
import { EVENT_META, fmtTimeS, type UiAgentEvent } from "../data";
import type { CrimeConfig, AnimalConfig } from "@/components/SecurityAlertsPanel";

interface Props {
  events: UiAgentEvent[];
  activeEventId: string;
  source: "live" | "import";
  setSource: (next: "live" | "import") => void;
  videoFile: File | null;
  setVideoFile: (next: File | null) => void;
  targetLabel: string;
  crimeConfig: CrimeConfig;
  animalConfig: AnimalConfig;
  openDrawer: () => void;
}

const SourceToggle = ({
  source,
  onChange,
}: {
  source: "live" | "import";
  onChange: (next: "live" | "import") => void;
}) => (
  <div className="inline-flex rounded-lg bg-ink-850 hairline p-0.5">
    {(["live", "import"] as const).map((s) => {
      const Icon = s === "live" ? icons.Radio : icons.Film;
      return (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={
            "h-8 px-3.5 rounded-[7px] text-[12px] font-medium uppercase tracking-wider flex items-center gap-2 transition-colors " +
            (source === s ? "bg-ink-700 text-ink-100" : "text-ink-400 hover:text-ink-200")
          }
        >
          <Icon size={13} />
          {s === "live" ? "Live" : "Import"}
        </button>
      );
    })}
  </div>
);

export default function LiveView({
  events,
  activeEventId,
  source,
  setSource,
  videoFile,
  setVideoFile,
  targetLabel,
  crimeConfig,
  animalConfig,
  openDrawer,
}: Props) {
  const activeEvent = events.find((e) => e.id === activeEventId) || events[0];
  const [hintDismissed, setHintDismissed] = useState(false);

  const sev = activeEvent ? EVENT_META[activeEvent.type].severity : "info";
  const reviewLabel = activeEvent?.executor
    ? activeEvent.executor.dest === "amazon.com"
      ? "Open refund at Amazon"
      : activeEvent.executor.dest?.includes("@")
      ? "Open email in Gmail"
      : "View log entry"
    : "View reasoning trace";

  return (
    <div className="h-full flex flex-col overflow-y-auto scroll-thin">
      <div className="px-8 pt-6 pb-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[20px] font-semibold tracking-tight text-ink-100">Front door</h1>
            <Pill color="#10b981">
              <StatusDot color="#10b981" pulse />
              Watching
            </Pill>
          </div>
          <div className="text-[12.5px] text-ink-400 mt-1">All quiet. Watching for deliveries.</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 h-8 rounded-md bg-ink-850 hairline">
            <icons.Eye size={13} className="text-ink-400" />
            <span className="text-[11.5px] text-ink-300">Phase</span>
            <Divider vertical className="mx-1" />
            <Mono className="text-[11.5px] text-em">detecting</Mono>
          </div>
          <div className="flex items-center gap-1 px-2.5 h-8 rounded-md bg-ink-850 hairline">
            <icons.User size={13} className="text-ink-400" />
            <span className="text-[11.5px] text-ink-300">Person</span>
            <Divider vertical className="mx-1" />
            <Mono className="text-[11.5px] text-em">present</Mono>
          </div>
          <div className="flex items-center gap-1 px-2.5 h-8 rounded-md bg-ink-850 hairline">
            <icons.Crosshair size={13} className="text-ink-400" />
            <span className="text-[11.5px] text-ink-300">Tracking</span>
            <Divider vertical className="mx-1" />
            <Mono className="text-[11.5px] text-ink-100">{targetLabel}</Mono>
          </div>
          <button
            onClick={openDrawer}
            className="h-8 w-8 rounded-md bg-ink-850 hairline xl:hidden hover:bg-ink-800 flex items-center justify-center"
            title="Open agent panel"
          >
            <icons.PanelRightOpen size={14} className="text-ink-300" />
          </button>
        </div>
      </div>

      <div className="px-8">
        <CameraStage
          source={source}
          videoFile={videoFile}
          targetLabel={targetLabel}
          crimeOptions={crimeConfig}
          animalOptions={animalConfig}
        />
      </div>

      <div className="px-8 mt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SourceToggle source={source} onChange={setSource} />
          {source === "import" ? (
            <label className="h-8 px-3 rounded-md bg-ink-850 hairline hover:bg-ink-800 flex items-center gap-2 text-[12px] text-ink-200 cursor-pointer">
              <icons.Upload size={13} className="text-ink-400" />
              {videoFile ? "Change file…" : "Choose video file…"}
              {videoFile && <span className="text-ink-500 font-mono text-[11px]">{videoFile.name}</span>}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setVideoFile(f);
                  e.target.value = "";
                }}
              />
            </label>
          ) : (
            <div className="flex items-center gap-2 text-[12px] text-ink-400">
              <icons.CircleCheck size={13} className="text-em" />
              Camera connected · stream healthy
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11.5px] text-ink-400">
          <icons.Activity size={12} className="text-ink-500" />
          <Mono className="text-ink-300 tabular-nums">12.4</Mono> fps
          <Divider vertical />
          <Mono className="text-ink-300 tabular-nums">78</Mono>ms detect
          <Divider vertical />
          <span>
            backend <Mono className="text-em">wasm</Mono>
          </span>
        </div>
      </div>

      <div className="px-8 mt-6 pb-8">
        {activeEvent && (
          <div className="grid grid-cols-2 gap-4">
            <Surface key={activeEvent.id} className="p-5 animate-flash">
              <div className="flex items-center justify-between">
                <SectionLabel>Current event</SectionLabel>
                <Mono className="text-[10px] text-ink-500">id {activeEvent.id}</Mono>
              </div>
              <div className="flex items-start gap-3 mt-3">
                <span className="text-[28px] leading-none">{EVENT_META[activeEvent.type].emoji}</span>
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-ink-100">
                    {EVENT_META[activeEvent.type].label}
                  </div>
                  <div className="text-[12.5px] text-ink-300 mt-1 leading-relaxed">
                    {activeEvent.vision.sentence}
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <SeverityChip sev={sev} />
                    <Divider vertical />
                    <Mono className="text-[11px] text-ink-400">
                      confidence {Math.round(activeEvent.confidence * 100)}%
                    </Mono>
                    <Divider vertical />
                    <span className="text-[11px] text-ink-400">{fmtTimeS(activeEvent.timestamp)}</span>
                  </div>
                </div>
              </div>
            </Surface>

            <Surface key={activeEvent.id + "-action"} className="p-5 animate-flash">
              <div className="flex items-center justify-between">
                <SectionLabel>Latest autonomous action</SectionLabel>
                <Pill color="#10b981">
                  <icons.Check size={11} />
                  Done
                </Pill>
              </div>
              <div className="mt-3">
                <div className="text-[15px] font-semibold text-ink-100 leading-snug">
                  {activeEvent.executor ? activeEvent.executor.sentence : "No action — reasoning agent ruled this out."}
                </div>
                {activeEvent.executor?.reference && (
                  <div className="text-[12.5px] text-ink-400 mt-2">
                    Reference <Mono className="text-ink-200">{activeEvent.executor.reference}</Mono>
                  </div>
                )}
                <button className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] text-em hover:text-emerald-300">
                  {reviewLabel} <icons.ArrowRight size={13} />
                </button>
              </div>
            </Surface>
          </div>
        )}

        {!hintDismissed && (
          <div className="mt-5 px-4 py-3 rounded-lg bg-ink-900 hairline flex items-center justify-between text-[12px] text-ink-400">
            <div className="flex items-center gap-2">
              <icons.Info size={13} className="text-ink-500" />
              Peep handles the doorstep so you don't have to. Tap any agent on the right to see how it decided.
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
                <span>Workbench</span>
              </div>
              <button
                onClick={() => setHintDismissed(true)}
                className="text-ink-500 hover:text-ink-200"
                title="Dismiss"
              >
                <icons.X size={12} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

