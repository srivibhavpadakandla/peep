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
  const [showSetup, setShowSetup] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [setupError, setSetupError] = useState<string | null>(null);
  const [setupSuccess, setSetupSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const redirectUri = typeof window !== "undefined" ? `${window.location.origin}/api/auth/callback/google` : "";

  const submitSetup = async () => {
    setSetupError(null);
    setSetupSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/setup/google", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id: clientId.trim(), client_secret: clientSecret.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error ?? `Setup failed (${res.status})`);
      } else {
        setSetupSuccess(data.message ?? "Saved. Restart npm run dev.");
        setClientId("");
        setClientSecret("");
      }
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const copyRedirectUri = async () => {
    try {
      await navigator.clipboard.writeText(redirectUri);
    } catch {
      // ignore
    }
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inbox-status");
      if (!res.ok) throw new Error(`inbox-status ${res.status}`);
      setInbox(await res.json());
    } catch (err) {
      // Server may be hot-reloading or offline. Don't crash the React tree;
      // surface as a no-op refresh — the panel renders a graceful empty state.
      console.warn("inbox-status fetch failed:", err);
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
            <div className="w-full space-y-2">
              <div className="text-[11px] text-amber-400">
                Google OAuth not configured. Peep is using the seeded demo inbox right now.
              </div>
              {!showSetup ? (
                <button
                  onClick={() => setShowSetup(true)}
                  className="px-3 py-1.5 text-xs rounded border border-emerald-700 text-emerald-300 hover:bg-emerald-950/40"
                >
                  Set up Gmail in-app
                </button>
              ) : (
                <div className="space-y-3 border border-neutral-800 rounded p-3 bg-neutral-950/60">
                  <ol className="text-[11px] text-neutral-300 space-y-2 list-decimal list-inside">
                    <li>
                      Open the{" "}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 underline hover:text-emerald-300"
                      >
                        Google Cloud Console credentials page ↗
                      </a>
                      , then click <span className="font-medium">Create credentials → OAuth client ID → Web application</span>.
                    </li>
                    <li>
                      Add this <span className="font-medium">Authorized redirect URI</span>:
                      <div className="mt-1 flex items-center gap-2">
                        <code className="flex-1 font-mono text-[10px] bg-neutral-900 border border-neutral-800 rounded px-2 py-1 truncate text-neutral-200">
                          {redirectUri}
                        </code>
                        <button
                          onClick={copyRedirectUri}
                          className="px-2 py-1 text-[10px] rounded border border-neutral-700 hover:bg-neutral-900"
                        >
                          Copy
                        </button>
                      </div>
                    </li>
                    <li>
                      Enable the Gmail API for your project at{" "}
                      <a
                        href="https://console.cloud.google.com/apis/library/gmail.googleapis.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 underline hover:text-emerald-300"
                      >
                        Gmail API ↗
                      </a>
                      .
                    </li>
                    <li>Paste the Client ID and Client Secret below:</li>
                  </ol>

                  <div className="space-y-1.5">
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-500">Client ID</span>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                        className="mt-0.5 w-full font-mono text-[11px] bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-200 placeholder:text-neutral-600"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-wide text-neutral-500">Client Secret</span>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="GOCSPX-…"
                        className="mt-0.5 w-full font-mono text-[11px] bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-neutral-200 placeholder:text-neutral-600"
                      />
                    </label>
                  </div>

                  {setupError && <div className="text-[11px] text-red-400">{setupError}</div>}
                  {setupSuccess && (
                    <div className="text-[11px] text-emerald-400 space-y-1">
                      <div>{setupSuccess}</div>
                      <div className="text-neutral-400">
                        In your terminal: press <code className="font-mono text-neutral-200">Ctrl+C</code> to stop, then run{" "}
                        <code className="font-mono text-neutral-200">npm run dev</code> again. Then refresh this page and click{" "}
                        <span className="text-emerald-300">Connect Gmail</span>.
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={submitSetup}
                      disabled={submitting || !clientId.trim() || !clientSecret.trim()}
                      className="px-3 py-1.5 text-xs rounded border border-emerald-700 text-emerald-300 hover:bg-emerald-950/40 disabled:opacity-50"
                    >
                      {submitting ? "Saving…" : "Save credentials"}
                    </button>
                    <button
                      onClick={() => {
                        setShowSetup(false);
                        setSetupError(null);
                        setSetupSuccess(null);
                      }}
                      className="px-2 py-1 text-[11px] rounded border border-neutral-800 text-neutral-400 hover:bg-neutral-900"
                    >
                      Cancel
                    </button>
                    <span className="ml-auto text-[10px] text-neutral-500">
                      Peep auto-generates <code className="font-mono">NEXTAUTH_SECRET</code> for you.
                    </span>
                  </div>
                </div>
              )}
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
