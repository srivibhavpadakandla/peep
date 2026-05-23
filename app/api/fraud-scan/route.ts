import { NextResponse } from "next/server";
import { parseYouTubeId, fetchVideoMeta } from "@/lib/fraud/youtube";
import { analyzeForFraud, type UploadedClip } from "@/lib/fraud/analyzer";
import { MAX_DURATION_SEC, type FraudReport, type VideoMeta } from "@/lib/fraud/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Gemini's inline-data ceiling is ~20MB. Keep a small safety margin. */
const MAX_UPLOAD_BYTES = 18 * 1024 * 1024;

/**
 * Two input modes:
 *   application/json     →  { url: "<YouTube URL>" }
 *   multipart/form-data  →  file=<video blob>
 *
 * Both return the same FraudReport shape.
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleUpload(request);
  }
  return handleUrl(request);
}

async function handleUrl(request: Request): Promise<Response> {
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
      { error: `That clip is ${formatDur(meta.durationSec)} long. Please use one under ${MAX_DURATION_SEC / 60} minutes.` },
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

async function handleUpload(request: Request): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid multipart body" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no file uploaded (expected field name 'file')" }, { status: 400 });
  }

  if (!file.type.startsWith("video/")) {
    return NextResponse.json(
      { error: `Upload a video file (got ${file.type || "unknown type"}).` },
      { status: 400 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File is ${formatBytes(file.size)}. Max ${formatBytes(MAX_UPLOAD_BYTES)} for inline analysis.` },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Build a VideoMeta-equivalent from the file. No YouTube id; use a stable
  // content-derived id so the heuristic fallback returns consistent results.
  const id = `upload-${hashBuffer(buffer).slice(0, 11)}`;
  const meta: VideoMeta = {
    id,
    url: "", // not a YouTube URL — UI renders a local <video> for these
    title: file.name || "Uploaded clip",
    author: null,
    durationSec: null,
    thumbnail: "",
  };

  const upload: UploadedClip = { buffer, mimeType: file.type };
  const analysis = await analyzeForFraud(meta, upload);

  const report: FraudReport = {
    video: meta,
    ...analysis,
    note: "Uploaded clip · analyzed inline.",
  };
  return NextResponse.json(report);
}

function formatDur(sec: number): string {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}

function formatBytes(n: number): string {
  const mb = n / (1024 * 1024);
  return `${mb.toFixed(1)}MB`;
}

function hashBuffer(buf: Buffer): string {
  // Tiny deterministic content hash — avoids pulling in crypto for a non-secret id.
  let h = 0;
  const step = Math.max(1, Math.floor(buf.length / 1024));
  for (let i = 0; i < buf.length; i += step) {
    h = (h * 31 + buf[i]) | 0;
  }
  return Math.abs(h).toString(36).padStart(11, "0");
}
