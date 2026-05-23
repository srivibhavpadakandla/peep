"use client";

import { useEffect, useRef, useState } from "react";
import { useAgentStore } from "@/lib/store";
import { embedUrl } from "@/lib/fraud/youtube";
import type { FraudReport, FraudSeverity, FraudVerdict } from "@/lib/fraud/types";

const LOADING_STAGES = [
  "Resolving video metadata…",
  "Checking clip length…",
  "Sampling frames (~1 every 2s)…",
  "Reasoning over evidence for fraud…",
  "Scoring risk and assembling findings…",
];

type InputMode = "url" | "upload";

/**
 * Side-panel section: paste a YouTube link (<3 min) OR upload a video file
 * (<18MB) and the analyzer flags fraudulent / suspicious activity. Self-contained
 * — talks only to /api/fraud-scan and mirrors a one-line result into the log.
 */
export default function FraudScanPanel() {
  const appendLog = useAgentStore((s) => s.appendLog);
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FraudReport | null>(null);
  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (stageTimer.current) clearInterval(stageTimer.current);
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  const onPickFile = (f: File | null) => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    if (!f) {
      setFile(null);
      setFilePreviewUrl(null);
      return;
    }
    setFile(f);
    setFilePreviewUrl(URL.createObjectURL(f));
    setError(null);
  };

  async function scan() {
    if (loading) return;
    if (mode === "url" && !url.trim()) return;
    if (mode === "upload" && !file) return;

    setLoading(true);
    setError(null);
    setReport(null);
    setStage(0);
    stageTimer.current = setInterval(() => {
      setStage((s) => Math.min(s + 1, LOADING_STAGES.length - 1));
    }, 900);

    try {
      let res: Response;
      if (mode === "url") {
        res = await fetch("/api/fraud-scan", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url }),
        });
      } else {
        const form = new FormData();
        form.append("file", file as File);
        res = await fetch("/api/fraud-scan", { method: "POST", body: form });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `scan failed (${res.status})`);
      const r = data as FraudReport;
      setReport(r);
      appendLog({
        source: "system",
        level: r.verdict === "clean" ? "info" : "warn",
        message: `fraud scan · ${verdictLabel(r.verdict)} · risk ${r.riskScore}/100 · ${r.video.title}`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (stageTimer.current) clearInterval(stageTimer.current);
      setLoading(false);
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPickFile(f);
  };

  return (
    <div className="space-y-6">
      <header className="border border-[#2C2C2A] bg-[#171716] p-4 rounded-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-400" />
          <h1 className="text-sm font-mono font-bold tracking-wider text-[#D2E7C9] uppercase">
            Fraud Scan
          </h1>
        </div>
        <p className="text-[11px] text-neutral-500 font-mono mt-1">
          Paste a YouTube clip or upload a video (under 3 min / 18 MB). The analyzer reviews it for
          porch theft, staged claims, card tampering, return fraud — and reports timestamped findings.
        </p>
      </header>

      {/* Input */}
      <div className="border border-[#2C2C2A] bg-[#171716] p-4 rounded-none space-y-3">
        {/* Mode toggle */}
        <div className="flex gap-1 text-[10px] font-mono tracking-wider uppercase">
          <button
            onClick={() => setMode("url")}
            className={`px-3 py-1.5 border ${
              mode === "url"
                ? "border-rose-700/60 text-rose-300 bg-rose-950/20"
                : "border-[#2C2C2A] text-neutral-500 hover:text-neutral-300"
            }`}
          >
            YouTube URL
          </button>
          <button
            onClick={() => setMode("upload")}
            className={`px-3 py-1.5 border ${
              mode === "upload"
                ? "border-rose-700/60 text-rose-300 bg-rose-950/20"
                : "border-[#2C2C2A] text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Upload File
          </button>
        </div>

        {mode === "url" && (
          <>
            <label className="text-[10px] font-semibold text-[#8C8C85] tracking-wider uppercase font-mono">
              YouTube URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && scan()}
                placeholder="https://www.youtube.com/watch?v=…  or  youtu.be/…"
                className="flex-1 bg-[#0A0A0A] border border-[#2C2C2A] text-[#E6E6E0] rounded-none px-3 py-2 text-xs font-mono focus:outline-none focus:border-rose-500/50 transition-colors"
              />
              <button
                onClick={scan}
                disabled={loading || !url.trim()}
                className="px-4 py-2 text-xs font-mono tracking-wider border border-rose-700/60 text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-none transition-all"
              >
                {loading ? "SCANNING…" : "ANALYZE"}
              </button>
            </div>
            <p className="text-[10px] text-neutral-600 font-mono">
              Clips over 3 minutes are rejected. Public videos only.
            </p>
          </>
        )}

        {mode === "upload" && (
          <>
            <label className="text-[10px] font-semibold text-[#8C8C85] tracking-wider uppercase font-mono">
              Video file
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed p-6 cursor-pointer transition-colors ${
                dragOver
                  ? "border-rose-500/60 bg-rose-950/20"
                  : "border-[#2C2C2A] bg-[#0A0A0A] hover:border-rose-700/40"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="space-y-1 font-mono text-xs">
                  <div className="text-rose-300 truncate">{file.name}</div>
                  <div className="text-[10px] text-neutral-500">
                    {file.type || "unknown type"} · {(file.size / (1024 * 1024)).toFixed(1)} MB
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPickFile(null);
                    }}
                    className="text-[10px] text-neutral-500 hover:text-rose-300 underline mt-1"
                  >
                    Choose a different file
                  </button>
                </div>
              ) : (
                <div className="text-center font-mono text-xs text-neutral-500 space-y-1">
                  <div>Drop a video here or click to browse</div>
                  <div className="text-[10px] text-neutral-600">.mp4, .mov, .webm — under 18MB, under 3 min</div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={scan}
                disabled={loading || !file}
                className="px-4 py-2 text-xs font-mono tracking-wider border border-rose-700/60 text-rose-300 bg-rose-950/20 hover:bg-rose-950/40 disabled:opacity-40 disabled:cursor-not-allowed rounded-none transition-all"
              >
                {loading ? "SCANNING…" : "ANALYZE"}
              </button>
            </div>
          </>
        )}
      </div>

      {loading && (
        <div className="border border-[#2C2C2A] bg-[#0A0A0A] p-4 rounded-none font-mono text-xs space-y-2">
          {LOADING_STAGES.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2 ${
                i < stage ? "text-emerald-500/70" : i === stage ? "text-rose-300" : "text-neutral-700"
              }`}
            >
              <span>{i < stage ? "✓" : i === stage ? "▸" : "·"}</span>
              <span>{s}</span>
              {i === stage && <span className="animate-pulse">…</span>}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="border border-red-900/40 bg-red-950/20 p-4 rounded-none text-xs text-red-300 font-mono">
          {error}
        </div>
      )}

      {report && !loading && <Report report={report} localPreviewUrl={mode === "upload" ? filePreviewUrl : null} />}
    </div>
  );
}

function Report({ report, localPreviewUrl }: { report: FraudReport; localPreviewUrl: string | null }) {
  const isUpload = report.video.id.startsWith("upload-");
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Player + verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[#2C2C2A] bg-black rounded-none overflow-hidden">
          <div className="aspect-video w-full">
            {isUpload && localPreviewUrl ? (
              <video src={localPreviewUrl} controls className="w-full h-full bg-black" />
            ) : isUpload ? (
              <div className="w-full h-full flex items-center justify-center text-neutral-600 font-mono text-xs">
                preview unavailable
              </div>
            ) : (
              <iframe
                src={embedUrl(report.video.id)}
                title={report.video.title}
                className="w-full h-full"
                allow="accelerometer; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
          <div className="p-3 border-t border-[#2C2C2A]">
            <p className="text-xs text-[#E6E6E0] font-medium line-clamp-2">{report.video.title}</p>
            <p className="text-[10px] text-neutral-500 font-mono mt-1">
              {isUpload ? "uploaded file" : report.video.author ?? "unknown channel"}
              {report.video.durationSec !== null && ` · ${fmtDur(report.video.durationSec)}`}
              {` · ${report.framesSampled} frames sampled`}
            </p>
          </div>
        </div>

        <VerdictCard report={report} />
      </div>

      {report.note && (
        <p className="text-[10px] text-amber-300/80 font-mono">⚠ {report.note}</p>
      )}

      {/* Findings */}
      <div className="border border-[#2C2C2A] bg-[#171716] p-4 rounded-none">
        <header className="mb-3 border-b border-[#2C2C2A]/60 pb-2 flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold tracking-wider text-[#8C8C85] uppercase">
            Findings
          </h2>
          <span className="text-[10px] text-neutral-500 font-mono">
            {report.findings.length} flagged
          </span>
        </header>
        {report.findings.length === 0 ? (
          <p className="text-xs text-neutral-500 font-mono py-4 text-center">
            No findings — nothing fraudulent was observed.
          </p>
        ) : (
          <ul className="space-y-2">
            {report.findings.map((f, i) => (
              <li key={i} className={`border rounded-none p-3 ${severityBox(f.severity)}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-neutral-400 tabular-nums">{f.at}</span>
                    <span className="text-sm text-neutral-100 font-medium">{f.label}</span>
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 border ${severityTag(f.severity)}`}>
                    {f.severity}
                  </span>
                </div>
                <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">{f.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function VerdictCard({ report }: { report: FraudReport }) {
  const tone = verdictTone(report.verdict);
  return (
    <div className={`border rounded-none p-4 flex flex-col justify-between ${tone.box}`}>
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">Verdict</div>
        <div className={`text-2xl font-mono font-bold tracking-tight mt-1 ${tone.text}`}>
          {verdictLabel(report.verdict)}
        </div>
        <p className="text-xs text-neutral-300 mt-3 leading-relaxed">{report.summary}</p>
      </div>

      <div className="mt-4 space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono text-neutral-500">
          <span>RISK SCORE</span>
          <span className={tone.text}>{report.riskScore}/100</span>
        </div>
        <div className="w-full bg-[#0A0A0A] h-2 border border-[#2C2C2A]">
          <div className={`h-full ${tone.bar}`} style={{ width: `${report.riskScore}%` }} />
        </div>
        <div className="flex items-center justify-between text-[9px] font-mono text-neutral-600 uppercase">
          <span>{report._mode === "gemini" ? "Gemini 2.0 Flash · multimodal" : "heuristic analyzer"}</span>
          <span>
            {report._mode === "gemini" ? "live model" : "offline · no API key"}
          </span>
        </div>
      </div>
    </div>
  );
}

function verdictLabel(v: FraudVerdict): string {
  return { fraud_detected: "FRAUD DETECTED", suspicious: "SUSPICIOUS", clean: "CLEAN" }[v];
}

function verdictTone(v: FraudVerdict): { box: string; text: string; bar: string } {
  switch (v) {
    case "fraud_detected":
      return { box: "border-red-800/60 bg-red-950/20", text: "text-red-300", bar: "bg-red-500" };
    case "suspicious":
      return { box: "border-amber-800/60 bg-amber-950/15", text: "text-amber-300", bar: "bg-amber-500" };
    case "clean":
      return { box: "border-emerald-800/60 bg-emerald-950/20", text: "text-emerald-300", bar: "bg-emerald-500" };
  }
}

function severityBox(s: FraudSeverity): string {
  return {
    info: "border-sky-900/40 bg-sky-950/10",
    warning: "border-amber-900/40 bg-amber-950/10",
    high: "border-orange-900/50 bg-orange-950/15",
    critical: "border-red-900/50 bg-red-950/20",
  }[s];
}

function severityTag(s: FraudSeverity): string {
  return {
    info: "border-sky-700/60 text-sky-300",
    warning: "border-amber-700/60 text-amber-300",
    high: "border-orange-700/60 text-orange-300",
    critical: "border-red-700/60 text-red-300",
  }[s];
}

function fmtDur(sec: number): string {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}
