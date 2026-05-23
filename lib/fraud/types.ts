/**
 * Types for the YouTube fraud-scan feature: paste a short clip, get back a
 * structured report of any fraudulent / suspicious activity the analyzer found.
 */

export type FraudVerdict = "fraud_detected" | "suspicious" | "clean";
export type FraudSeverity = "info" | "warning" | "high" | "critical";

export interface FraudFinding {
  /** Position in the clip, formatted "m:ss". */
  at: string;
  /** Short headline for the finding. */
  label: string;
  severity: FraudSeverity;
  /** One or two sentences describing what was observed. */
  description: string;
}

export interface VideoMeta {
  id: string;
  url: string;
  title: string;
  author: string | null;
  /** null when we couldn't determine it without an API key. */
  durationSec: number | null;
  thumbnail: string;
}

/** The analysis half of a report (everything not derived from metadata). */
export interface FraudAnalysis {
  verdict: FraudVerdict;
  /** 0–100, higher = more likely fraudulent. */
  riskScore: number;
  findings: FraudFinding[];
  summary: string;
  framesSampled: number;
  _mode: "gemini" | "heuristic";
}

export interface FraudReport extends FraudAnalysis {
  video: VideoMeta;
  /** Set when something noteworthy happened (e.g. duration unverifiable). */
  note?: string;
}

/** Clips longer than this are rejected. */
export const MAX_DURATION_SEC = 180;

export const SEVERITIES: readonly FraudSeverity[] = ["info", "warning", "high", "critical"];
export const VERDICTS: readonly FraudVerdict[] = ["fraud_detected", "suspicious", "clean"];
