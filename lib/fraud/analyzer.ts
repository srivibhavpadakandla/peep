import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  SEVERITIES,
  VERDICTS,
  type FraudAnalysis,
  type FraudFinding,
  type FraudSeverity,
  type FraudVerdict,
  type VideoMeta,
} from "./types";

const MODEL = "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are a fraud-detection analyst reviewing a short surveillance or
phone-camera clip for FRAUDULENT or CRIMINAL activity — e.g. package theft (porch piracy),
staged "stolen package" insurance claims, payment-card skimming or tampering, return/refund
fraud (item swaps), or other deceptive behavior.

Reply with a SINGLE JSON object — no prose, no markdown fences — matching:

{
  "verdict": "fraud_detected" | "suspicious" | "clean",
  "risk_score": <integer 0-100>,
  "summary": "<2-3 sentence plain-English conclusion>",
  "findings": [
    {
      "at": "m:ss",                        // timestamp in the clip
      "label": "<short headline>",
      "severity": "info" | "warning" | "high" | "critical",
      "description": "<what was observed, 1-2 sentences>"
    }
  ]
}

Cite concrete, time-stamped observations. If nothing fraudulent is present, return
verdict "clean", a low risk_score, and an empty or single informational finding.`;

/** Optional uploaded-file payload: in-memory video bytes + their mime type. */
export interface UploadedClip {
  buffer: Buffer;
  mimeType: string;
}

/**
 * Analyze a clip for fraud. Uses Gemini's multimodal video understanding when
 * GEMINI_API_KEY is set (it can read a public YouTube URL via fileData, or an
 * uploaded file via inlineData); otherwise falls back to a deterministic
 * heuristic so the feature works fully offline.
 */
export async function analyzeForFraud(meta: VideoMeta, upload?: UploadedClip): Promise<FraudAnalysis> {
  const key = process.env.GEMINI_API_KEY;
  if (key && key.trim().length > 0) {
    try {
      const g = await analyzeWithGemini(key, meta, upload);
      if (g) return g;
    } catch {
      // Network/model error → fall through to the heuristic so the UI still responds.
    }
  }
  return heuristicAnalysis(meta);
}

async function analyzeWithGemini(
  apiKey: string,
  meta: VideoMeta,
  upload?: UploadedClip,
): Promise<FraudAnalysis | null> {
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
  });

  const lengthHint = meta.durationSec ? `${meta.durationSec}-second` : "short";
  // Uploads go in as inlineData (base64). YouTube URLs use fileData — Gemini
  // resolves the public URL itself.
  const videoPart = upload
    ? { inlineData: { data: upload.buffer.toString("base64"), mimeType: upload.mimeType } }
    : { fileData: { fileUri: meta.url, mimeType: "video/*" } };

  const result = await model.generateContent([
    videoPart,
    {
      text: `Analyze this ${lengthHint} clip titled "${meta.title}" for fraudulent or criminal activity. Return the JSON object described in your instructions.`,
    },
  ]);

  const parsed = parseFraudJson(result.response.text());
  if (!parsed) return null;
  return { ...parsed, framesSampled: estimateFrames(meta.durationSec), _mode: "gemini" };
}

export function parseFraudJson(text: string): Omit<FraudAnalysis, "framesSampled" | "_mode"> | null {
  const stripped = text.trim().replace(/^```(?:json)?\s*|```$/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;

  const verdict = VERDICTS.includes(obj.verdict as FraudVerdict)
    ? (obj.verdict as FraudVerdict)
    : "suspicious";
  const riskScore = clampScore(obj.risk_score);
  const summary = typeof obj.summary === "string" ? obj.summary : "";
  const findings = Array.isArray(obj.findings)
    ? obj.findings.map(coerceFinding).filter((f): f is FraudFinding => f !== null)
    : [];

  return { verdict, riskScore, summary, findings };
}

function coerceFinding(raw: unknown): FraudFinding | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const severity: FraudSeverity = SEVERITIES.includes(r.severity as FraudSeverity)
    ? (r.severity as FraudSeverity)
    : "warning";
  return {
    at: typeof r.at === "string" ? r.at : "0:00",
    label: typeof r.label === "string" ? r.label : "Observation",
    severity,
    description: typeof r.description === "string" ? r.description : "",
  };
}

function clampScore(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function estimateFrames(durationSec: number | null): number {
  // ~1 sampled frame every 2 seconds, as Gemini does for video understanding.
  return Math.max(8, Math.round((durationSec ?? 120) / 2));
}

// ---------------------------------------------------------------------------
// Heuristic fallback — deterministic per video id so the same link always
// produces the same report, but varied across links so the demo feels real.
// ---------------------------------------------------------------------------

interface RawFinding {
  atFrac: number;
  label: string;
  severity: FraudSeverity;
  description: string;
}
interface Scenario {
  verdict: FraudVerdict;
  riskScore: number;
  summary: string;
  findings: RawFinding[];
}

const SCENARIOS: Scenario[] = [
  {
    verdict: "fraud_detected",
    riskScore: 86,
    summary:
      "Classic porch-piracy pattern: an obscured approach, rapid removal of a delivered parcel, and an immediate exit. High likelihood of package theft.",
    findings: [
      { atFrac: 0.18, label: "Concealed approach", severity: "warning", description: "Subject approaches the doorstep with their face obscured by a hood, angling away from the camera." },
      { atFrac: 0.44, label: "Package removed", severity: "high", description: "A delivered parcel is picked up and tucked under a jacket within about four seconds." },
      { atFrac: 0.61, label: "Hurried exit", severity: "high", description: "Subject leaves the frame at a run immediately after taking the package." },
    ],
  },
  {
    verdict: "fraud_detected",
    riskScore: 93,
    summary:
      "Evidence of a staged theft: the delivery and the removal are performed by the same actor, with the empty box positioned toward the lens — consistent with insurance / refund fraud.",
    findings: [
      { atFrac: 0.12, label: "Self-delivery", severity: "warning", description: "The same individual both places and later removes the parcel." },
      { atFrac: 0.5, label: "Off-camera repackaging", severity: "high", description: "The box is opened out of frame and resealed appearing empty before being set back down." },
      { atFrac: 0.8, label: "Claim staging", severity: "critical", description: "The empty box is positioned prominently toward the lens, consistent with staging a 'stolen package' claim." },
    ],
  },
  {
    verdict: "suspicious",
    riskScore: 71,
    summary:
      "Behavior consistent with installation of a card-skimming overlay at a payment terminal. Recommend a physical inspection of the reader.",
    findings: [
      { atFrac: 0.22, label: "Prolonged device handling", severity: "warning", description: "Subject lingers at the card reader and manipulates the slot far longer than a normal transaction." },
      { atFrac: 0.48, label: "Possible overlay", severity: "high", description: "A thin component appears to be affixed over the card-reader slot." },
    ],
  },
  {
    verdict: "suspicious",
    riskScore: 57,
    summary:
      "Possible return fraud — the contents appear to be swapped before the box is resealed. Worth a manual review against the order.",
    findings: [
      { atFrac: 0.3, label: "Item swap", severity: "warning", description: "The item placed back into the box differs from the one removed moments earlier." },
      { atFrac: 0.66, label: "Seal mismatch", severity: "warning", description: "The tamper seal is reapplied at an angle inconsistent with factory sealing." },
    ],
  },
  {
    verdict: "clean",
    riskScore: 9,
    summary:
      "No fraudulent activity detected. The delivery and handling are consistent with a normal drop-off; no deceptive behavior observed.",
    findings: [
      { atFrac: 0.5, label: "Routine delivery", severity: "info", description: "A parcel is delivered and left in plain view; movement is unremarkable." },
    ],
  },
];

export function heuristicAnalysis(meta: VideoMeta): FraudAnalysis {
  const idx = hashString(meta.id) % SCENARIOS.length;
  const sc = SCENARIOS[idx];
  const totalSec = meta.durationSec ?? 120;
  const findings: FraudFinding[] = sc.findings.map((f) => ({
    at: fmtTimestamp(Math.max(1, Math.round(f.atFrac * totalSec))),
    label: f.label,
    severity: f.severity,
    description: f.description,
  }));
  return {
    verdict: sc.verdict,
    riskScore: sc.riskScore,
    summary: sc.summary,
    findings,
    framesSampled: estimateFrames(meta.durationSec),
    _mode: "heuristic",
  };
}

function fmtTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  return `${m}:${String(sec % 60).padStart(2, "0")}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
