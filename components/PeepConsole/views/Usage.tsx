"use client";

import { icons } from "lucide-react";
import { DEMO_USAGE, EVENT_META, fmtDay, fmtTime } from "../data";
import { Btn, Mono, SectionLabel, Surface } from "../primitives";

const StatTile = ({
  label,
  value,
  sub,
  mono,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  mono?: boolean;
  accent?: boolean;
}) => (
  <Surface className="p-6">
    <SectionLabel>{label}</SectionLabel>
    <div className="mt-3 flex items-baseline gap-2">
      <span
        className={
          "text-[34px] font-semibold tracking-tight tabular-nums " +
          (mono ? "font-mono " : "") +
          (accent ? "text-em" : "text-ink-100")
        }
      >
        {value}
      </span>
      {sub && <span className="text-[12.5px] text-ink-400">{sub}</span>}
    </div>
  </Surface>
);

export default function UsageView({ apiKeySet }: { apiKeySet: boolean }) {
  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="px-8 pt-6 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink-100">Usage</h1>
          <div className="text-[12.5px] text-ink-400 mt-1">
            What Peep has actually spent this month. Real numbers — only counts when the API is called.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 h-8 rounded-md bg-ink-850 hairline">
            <icons.Calendar size={13} className="text-ink-400" />
            <span className="text-[12px] text-ink-300">{new Date().toLocaleDateString([], { month: "long", year: "numeric" })}</span>
          </div>
          <Btn variant="secondary" size="sm">
            <icons.Receipt size={12} />
            Billing
          </Btn>
        </div>
      </div>

      <div className="px-8 grid grid-cols-3 gap-5">
        {apiKeySet ? (
          <>
            <StatTile label="Cost to date" value={"$" + DEMO_USAGE.cost_usd.toFixed(4)} sub="this month" mono accent />
            <StatTile label="Tokens used" value={DEMO_USAGE.tokens.toLocaleString()} sub="in/out combined" mono />
            <StatTile
              label="API calls"
              value={DEMO_USAGE.calls}
              sub={"avg " + Math.round(DEMO_USAGE.tokens / DEMO_USAGE.calls) + " tok/call"}
              mono
            />
          </>
        ) : (
          <Surface className="col-span-3 p-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-ink-800 flex items-center justify-center hairline">
                <icons.KeyRound size={18} className="text-ink-400" />
              </div>
              <div>
                <div className="text-[15px] font-semibold text-ink-100">Rule-based router · no API calls</div>
                <div className="text-[12.5px] text-ink-400 mt-1">
                  Add a Gemini API key in Settings to enable the reasoning agent.
                </div>
              </div>
              <div className="flex-1" />
              <Btn variant="primary" size="md">
                Add API key
              </Btn>
            </div>
          </Surface>
        )}
      </div>

      <div className="px-8 mt-8 pb-10">
        <div className="flex items-end justify-between mb-3">
          <SectionLabel>Recent orchestration calls</SectionLabel>
          <Mono className="text-[10px] text-ink-500">most recent first</Mono>
        </div>
        <div className="rounded-xl bg-ink-850 hairline overflow-hidden">
          <div className="grid grid-cols-[160px_1fr_120px_120px] gap-4 px-5 py-2.5 hairline-b text-[10.5px] uppercase tracking-[0.12em] text-ink-500">
            <div>Time</div>
            <div>Workflow</div>
            <div className="text-right">Tokens</div>
            <div className="text-right">Cost</div>
          </div>
          {DEMO_USAGE.recent.map((c, i) => (
            <div
              key={i}
              className={
                "grid grid-cols-[160px_1fr_120px_120px] gap-4 px-5 py-3.5 items-center " +
                (i < DEMO_USAGE.recent.length - 1 ? "hairline-b" : "")
              }
            >
              <Mono className="text-[12px] text-ink-300 tabular-nums">
                {fmtDay(c.t)} · {fmtTime(c.t)}
              </Mono>
              <div className="flex items-center gap-2">
                <span className="text-[14px]">{EVENT_META[c.workflow].emoji}</span>
                <span className="text-[13px] text-ink-100">{EVENT_META[c.workflow].label}</span>
              </div>
              <Mono className="text-[12.5px] text-ink-200 tabular-nums text-right">
                {c.tokens.toLocaleString()}
              </Mono>
              <Mono className="text-[12.5px] text-ink-200 tabular-nums text-right">${c.cost.toFixed(4)}</Mono>
            </div>
          ))}
        </div>

        <div className="mt-4 text-[11.5px] text-ink-500">
          Peep only calls the model when an event passes the orchestrator gate. Below 50% confidence, the rule-based
          router handles routing for free.
        </div>
      </div>
    </div>
  );
}
