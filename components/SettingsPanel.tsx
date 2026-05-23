"use client";

import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

interface InboxStatus {
  configured: boolean;
  connected: boolean;
  email: string | null;
  source: "gmail" | "seed";
}

export default function SettingsPanel() {
  const { status } = useSession();
  const [inbox, setInbox] = useState<InboxStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox-status");
      setInbox(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [status]);

  const sessionLoading = status === "loading";
  const configured = inbox?.configured ?? false;
  const connected = inbox?.connected ?? false;

  return (
    <section className="border border-neutral-800 rounded bg-neutral-950 p-3 space-y-4">
      <header>
        <h2 className="text-sm font-medium text-neutral-200">Settings</h2>
        <p className="text-[11px] text-neutral-500">Configure how Peep gets its data.</p>
      </header>

      <div className="border border-neutral-800 rounded bg-neutral-900/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-neutral-200">Inbox source</div>
            <div className="text-[11px] text-neutral-500">
              Peep reads expected deliveries from this inbox.
            </div>
          </div>
          <span
            className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${
              connected
                ? "border-emerald-700 text-emerald-400 bg-emerald-950/40"
                : "border-neutral-700 text-neutral-400 bg-neutral-900"
            }`}
          >
            {inbox?.source ?? "—"}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {!configured ? (
            <div className="text-[11px] text-amber-400">
              Google OAuth not configured. Add <code className="font-mono text-amber-300">GOOGLE_CLIENT_ID</code>{" "}
              and <code className="font-mono text-amber-300">GOOGLE_CLIENT_SECRET</code> to{" "}
              <code className="font-mono text-amber-300">.env.local</code>, then restart{" "}
              <code className="font-mono">npm run dev</code>. Until then, Peep uses the seeded demo inbox.
            </div>
          ) : connected ? (
            <>
              <span className="text-xs text-neutral-300">
                Connected as{" "}
                <span className="font-mono text-emerald-400">{inbox?.email ?? "unknown"}</span>
              </span>
              <button
                onClick={async () => {
                  await signOut({ redirect: false });
                  await refresh();
                }}
                className="px-2 py-1 text-xs rounded border border-neutral-700 hover:bg-neutral-900"
              >
                Disconnect
              </button>
            </>
          ) : (
            <button
              onClick={() => signIn("google")}
              disabled={sessionLoading || loading}
              className="px-3 py-1.5 text-xs rounded border border-emerald-700 text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50"
            >
              Connect Gmail
            </button>
          )}

          <button
            onClick={() => void refresh()}
            disabled={loading}
            className="ml-auto px-2 py-1 text-[11px] rounded border border-neutral-800 text-neutral-400 hover:bg-neutral-900 disabled:opacity-50"
          >
            {loading ? "…" : "Refresh"}
          </button>
        </div>

        <p className="mt-3 text-[11px] text-neutral-500">
          We only request <code className="font-mono">gmail.readonly</code>. Peep cannot send or modify mail.
        </p>
      </div>
    </section>
  );
}
