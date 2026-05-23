"use client";

import { useState } from "react";
import { icons } from "lucide-react";
import { DEMO_LOGS, LOG_SOURCES, fmtTimeS } from "../data";
import { Btn, Chip, Mono } from "../primitives";

const SOURCE_COLOR: Record<string, string> = {
  vision: "#22d3ee",
  orchestration: "#60a5fa",
  browser: "#a78bfa",
  system: "#10b981",
};

export default function LogsView() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<string>("all");

  const filtered = DEMO_LOGS.filter(
    (l) =>
      (source === "all" || l.source === source) &&
      (!query || l.text.toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 pt-6 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink-100">Logs</h1>
          <div className="text-[12.5px] text-ink-400 mt-1">
            {filtered.length} events shown · plain English, not log-line gibberish.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <icons.Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search logs…"
              className="h-8 pl-7 pr-3 w-[220px] rounded-md bg-ink-850 hairline text-[12.5px] text-ink-100 placeholder:text-ink-500 focus:outline-none focus:bg-ink-800"
            />
          </div>
          <Btn variant="secondary" size="sm">
            <icons.Download size={12} />
            Export
          </Btn>
        </div>
      </div>

      <div className="px-8 flex items-center gap-2">
        <Chip active={source === "all"} onClick={() => setSource("all")}>
          All
        </Chip>
        {LOG_SOURCES.map((s) => (
          <Chip key={s} active={source === s} onClick={() => setSource(s)}>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: SOURCE_COLOR[s] }} />
              {s}
            </span>
          </Chip>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin px-8 pt-4 pb-8">
        <div className="rounded-xl bg-ink-850 hairline overflow-hidden">
          {filtered.map((l, i) => (
            <div
              key={i}
              className={
                "grid grid-cols-[80px_120px_1fr] gap-4 px-5 py-3 items-start " +
                (i < filtered.length - 1 ? "hairline-b" : "")
              }
            >
              <Mono className="text-[11px] text-ink-500 tabular-nums mt-0.5">{fmtTimeS(l.t)}</Mono>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: SOURCE_COLOR[l.source] }} />
                <span
                  className="text-[11.5px] uppercase tracking-wider font-medium"
                  style={{ color: SOURCE_COLOR[l.source] }}
                >
                  {l.source}
                </span>
              </div>
              <div className="text-[13px] text-ink-200 leading-snug">{l.text}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="px-6 py-14 text-center">
              <icons.ScrollText size={22} className="text-ink-500 mx-auto" />
              <div className="text-[13px] text-ink-200 mt-3">No matches.</div>
              <div className="text-[12px] text-ink-500 mt-1">Try a different filter.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
