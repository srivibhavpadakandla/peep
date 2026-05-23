"use client";

import { useEffect, useState } from "react";
import { icons } from "lucide-react";
import { DEMO_INBOX, fmtTimeS, type DemoInboxItem } from "../data";
import { Btn, Divider, Mono, SectionLabel, Toggle } from "../primitives";

export default function InboxView() {
  const [items, setItems] = useState<DemoInboxItem[]>(DEMO_INBOX);
  const [autoSweep, setAutoSweep] = useState(true);
  const [sweeping, setSweeping] = useState(false);
  const [today, setToday] = useState<string>("");
  const [lastSweepAt, setLastSweepAt] = useState<number | null>(null);

  // Try to fetch real inbox; if it has expected deliveries, replace the demo seed.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.expected) && data.expected.length > 0) {
          setItems(
            data.expected.map(
              (e: { order_id: string; item_description: string; received: boolean }, idx: number) => ({
                id: e.order_id,
                item: e.item_description,
                status: e.received ? "received" : "pending",
                from: "Amazon",
                eta: ["11:30 AM", "2:15 PM", "4:00 PM", "5:30 PM"][idx % 4],
              }),
            ),
          );
        }
        setToday(typeof data.today === "string" ? data.today : "");
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const togglePill = (id: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: i.status === "pending" ? "received" : "pending" } : i)),
    );

  const sweep = () => {
    setSweeping(true);
    setLastSweepAt(Date.now());
    setTimeout(() => setSweeping(false), 1200);
  };

  const pending = items.filter((i) => i.status === "pending").length;
  const received = items.length - pending;

  const SearchIcon = sweeping ? icons.Loader : icons.Search;

  return (
    <div className="h-full overflow-y-auto scroll-thin">
      <div className="px-8 pt-6 pb-4 flex items-end justify-between">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-ink-100">Inbox</h1>
          <div className="text-[12.5px] text-ink-400 mt-1">
            Deliveries Peep is expecting {today ? `(${today})` : "today"}, parsed from your Gmail.
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Toggle on={autoSweep} onChange={setAutoSweep} />
            <span className="text-[12.5px] text-ink-300">Auto-sweep every 30s</span>
          </div>
          <Divider vertical />
          <Btn variant="primary" size="md" onClick={sweep}>
            <SearchIcon size={13} className={sweeping ? "animate-spin" : ""} />
            Check missing now
          </Btn>
        </div>
      </div>

      <div className="px-8">
        <div className="flex items-center gap-5 px-5 py-3.5 rounded-lg bg-ink-900 hairline">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <Mono className="text-[13px] text-ink-100 tabular-nums">{pending}</Mono>
            <span className="text-[12px] text-ink-400">pending</span>
          </div>
          <Divider vertical />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-em" />
            <Mono className="text-[13px] text-ink-100 tabular-nums">{received}</Mono>
            <span className="text-[12px] text-ink-400">received</span>
          </div>
          <Divider vertical />
          <div className="flex items-center gap-2 text-[12px] text-ink-400">
            <icons.Mail size={13} className="text-ink-500" />
            Connected as <Mono className="text-ink-200 ml-1">jamie@hello.com</Mono>
          </div>
          <div className="flex-1" />
          <div className="text-[11px] text-ink-500">
            Last sweep <Mono className="text-ink-300">{lastSweepAt ? fmtTimeS(lastSweepAt) : "—"}</Mono>
          </div>
        </div>
      </div>

      <div className="px-8 mt-5 pb-10">
        <div className="rounded-xl bg-ink-850 hairline overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-2.5 hairline-b text-[10.5px] uppercase tracking-[0.12em] text-ink-500">
            <div>Item</div>
            <div>From</div>
            <div>ETA</div>
            <div className="w-[110px] text-right">Status</div>
          </div>
          {items.map((it, i) => (
            <div
              key={it.id}
              className={
                "grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-4 items-center " +
                (i < items.length - 1 ? "hairline-b" : "")
              }
            >
              <div className="min-w-0">
                <div className="text-[13.5px] text-ink-100">{it.item}</div>
                <Mono className="text-[11px] text-ink-500 mt-0.5">{it.id}</Mono>
              </div>
              <div className="text-[12px] text-ink-300 flex items-center gap-2">
                <icons.Truck size={12} className="text-ink-500" />
                {it.from}
              </div>
              <Mono className="text-[12px] text-ink-300 tabular-nums">{it.eta}</Mono>
              <div className="w-[110px] flex justify-end">
                <button
                  onClick={() => togglePill(it.id)}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[12px] font-medium transition-colors"
                  style={
                    it.status === "received"
                      ? {
                          color: "#10b981",
                          background: "rgba(16,185,129,0.10)",
                          boxShadow: "inset 0 0 0 1px rgba(16,185,129,0.33)",
                        }
                      : {
                          color: "#fbbf24",
                          background: "rgba(251,191,36,0.10)",
                          boxShadow: "inset 0 0 0 1px rgba(251,191,36,0.33)",
                        }
                  }
                >
                  {it.status === "received" ? <icons.Check size={12} /> : <icons.Clock size={12} />}
                  {it.status === "received" ? "Received" : "Pending"}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <SectionLabel className="px-1 mb-2">Tomorrow</SectionLabel>
          <div className="rounded-xl bg-ink-900 hairline px-6 py-10 text-center">
            <icons.Package size={22} className="text-ink-500 mx-auto" />
            <div className="text-[13px] text-ink-200 mt-3">No deliveries expected tomorrow.</div>
            <div className="text-[12px] text-ink-500 mt-1">Peep is still watching.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
