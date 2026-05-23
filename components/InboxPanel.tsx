"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import type { ExpectedDelivery, InboxEmail } from "@/lib/inbox/types";
import { findMissingDeliveries } from "@/lib/inbox/checker";
import type { CameraEvent } from "@/lib/contract";

const AUTO_INTERVAL_MS = 30_000;

export default function InboxPanel() {
  const [emails, setEmails] = useState<InboxEmail[]>([]);
  const [today, setToday] = useState<string>("");
  const [expected, setExpected] = useState<ExpectedDelivery[]>([]);
  const [autoMode, setAutoMode] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastSweepAt, setLastSweepAt] = useState<number | null>(null);

  const lastEvent = useAgentStore((s) => s.lastEvent);
  const publishEvent = useAgentStore((s) => s.publishEvent);
  const appendLog = useAgentStore((s) => s.appendLog);

  // Initial inbox load.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/inbox")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setEmails(data.emails);
        setToday(data.today);
        setExpected(data.expected);
        appendLog({
          source: "system",
          level: "info",
          message: `inbox: ${data.expected.length} expected delivery(ies) today`,
        });
      })
      .catch((err) => appendLog({ source: "system", level: "error", message: `inbox load failed: ${err}` }));
    return () => {
      cancelled = true;
    };
  }, [appendLog]);

  // Auto-mark first unreceived delivery when the camera sees an arrival.
  const handledArrivalAt = useRef<number>(0);
  useEffect(() => {
    if (!lastEvent) return;
    if (lastEvent.event_type !== "package_arrived") return;
    if (lastEvent.timestamp === handledArrivalAt.current) return;
    handledArrivalAt.current = lastEvent.timestamp;
    setExpected((prev) => {
      const idx = prev.findIndex((d) => !d.received);
      if (idx === -1) return prev;
      const next = prev.slice();
      next[idx] = { ...next[idx], received: true };
      appendLog({
        source: "system",
        level: "info",
        message: `auto-matched arrival to order ${next[idx].order_id}`,
      });
      return next;
    });
  }, [lastEvent, appendLog]);

  const sweep = useCallback(async () => {
    setChecking(true);
    setLastSweepAt(Date.now());
    try {
      // Count arrivals observed since the panel loaded: any expected entry already
      // marked received counts; nothing else is consulted (the matching happens above).
      const missing = findMissingDeliveries(expected, 0);
      if (missing.length === 0) {
        appendLog({ source: "system", level: "info", message: "inbox sweep: no missing deliveries" });
        return;
      }
      for (const m of missing) {
        const event: CameraEvent = {
          event_type: "package_not_arrived",
          timestamp: Date.now(),
          confidence: 0.9,
          evidence_clip: {
            url: `inbox:${m.email_id}`,
            duration_ms: 0,
            mime_type: "application/x-inbox-reference",
          },
        };
        // Stuff the order_id onto the event for the orchestration router to pick up.
        (event as unknown as { order_id?: string }).order_id = m.order_id;
        appendLog({
          source: "system",
          level: "warn",
          message: `inbox sweep: order ${m.order_id} not delivered — emitting package_not_arrived`,
        });
        publishEvent(event);
      }
    } finally {
      setChecking(false);
    }
  }, [expected, appendLog, publishEvent]);

  // Auto-mode polling.
  useEffect(() => {
    if (!autoMode) return;
    const id = setInterval(() => {
      void sweep();
    }, AUTO_INTERVAL_MS);
    return () => clearInterval(id);
  }, [autoMode, sweep]);

  const toggleReceived = (order_id: string) => {
    setExpected((prev) =>
      prev.map((d) => (d.order_id === order_id ? { ...d, received: !d.received } : d)),
    );
  };

  const unreceived = expected.filter((d) => !d.received).length;

  return (
    <section className="border border-neutral-800 rounded bg-neutral-950 p-3">
      <header className="flex items-center justify-between mb-2 gap-2">
        <h2 className="text-sm font-medium text-neutral-200">Inbox · expected today</h2>
        <span className="text-[10px] uppercase tracking-wide text-neutral-500">
          {today || "—"} · {unreceived} pending
        </span>
      </header>

      <div className="flex items-center gap-2 mb-2 text-xs">
        <button
          className="px-2 py-1 rounded border border-neutral-700 hover:bg-neutral-900 disabled:opacity-50"
          onClick={() => void sweep()}
          disabled={checking}
        >
          {checking ? "Checking…" : "Check missing now"}
        </button>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoMode}
            onChange={(e) => setAutoMode(e.target.checked)}
            className="accent-emerald-500"
          />
          <span>Auto-sweep every {AUTO_INTERVAL_MS / 1000}s</span>
        </label>
        {lastSweepAt && (
          <span className="text-[10px] text-neutral-500 ml-auto">
            last sweep {new Date(lastSweepAt).toLocaleTimeString()}
          </span>
        )}
      </div>

      {expected.length === 0 ? (
        <p className="text-xs text-neutral-500">No deliveries expected today.</p>
      ) : (
        <ul className="space-y-1">
          {expected.map((d) => (
            <li
              key={d.order_id}
              className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded border ${
                d.received
                  ? "border-emerald-700 bg-emerald-950/40"
                  : "border-neutral-800 bg-neutral-900/40"
              }`}
            >
              <button
                onClick={() => toggleReceived(d.order_id)}
                title="Toggle received"
                className={`w-4 h-4 rounded border flex items-center justify-center ${
                  d.received ? "border-emerald-500 text-emerald-400" : "border-neutral-600 text-transparent"
                }`}
              >
                ✓
              </button>
              <div className="flex-1 min-w-0">
                <div className="truncate">{d.item_description}</div>
                <div className="text-[10px] text-neutral-500 font-mono">{d.order_id}</div>
              </div>
              <span
                className={`text-[10px] uppercase tracking-wide ${
                  d.received ? "text-emerald-400" : "text-amber-400"
                }`}
              >
                {d.received ? "received" : "pending"}
              </span>
            </li>
          ))}
        </ul>
      )}

      <details className="mt-2">
        <summary className="text-[11px] text-neutral-500 cursor-pointer">
          Inbox ({emails.length} email{emails.length === 1 ? "" : "s"})
        </summary>
        <div className="mt-1 space-y-1 max-h-40 overflow-y-auto pr-1">
          {emails.map((e) => (
            <div key={e.id} className="text-[11px] border border-neutral-800 rounded p-1.5">
              <div className="font-mono text-neutral-500 truncate">{e.from}</div>
              <div className="text-neutral-300 truncate">{e.subject}</div>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}
