import { NextResponse } from "next/server";
import { parseYouTubeId, fetchVideoMeta } from "@/lib/fraud/youtube";
import { analyzeForFraud } from "@/lib/fraud/analyzer";
import { MAX_DURATION_SEC, type FraudReport } from "@/lib/fraud/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST { url: string } → FraudReport
 *
 * Resolves a YouTube link, enforces the <3-minute cap, then runs fraud analysis
 * (real Gemini multimodal when GEMINI_API_KEY is set, deterministic heuristic
 * otherwise).
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const url = (body as { url?: unknown } | null)?.url;
  if (typeof url !== "string" || !url.trim()) {
    return NextResponse.json({ error: "Paste a YouTube URL to scan." }, { status: 400 });
  }

  const id = parseYouTubeId(url);
  if (!id) {
    return NextResponse.json(
      { error: "That doesn't look like a YouTube link. Use a youtube.com/watch, youtu.be, or /shorts URL." },
      { status: 400 },
    );
  }

  const meta = await fetchVideoMeta(id);

  if (meta.durationSec !== null && meta.durationSec > MAX_DURATION_SEC) {
    return NextResponse.json(
      {
        error: `That clip is ${formatDur(meta.durationSec)} long. Please use one under ${MAX_DURATION_SEC / 60} minutes.`,
      },
      { status: 400 },
    );
  }

  const analysis = await analyzeForFraud(meta);
  const report: FraudReport = {
    video: meta,
    ...analysis,
    note:
      meta.durationSec === null
        ? "Couldn't verify the clip length, so it was analyzed as a short clip."
        : undefined,
  };
  return NextResponse.json(report);
}

function formatDur(sec: number): string {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}
