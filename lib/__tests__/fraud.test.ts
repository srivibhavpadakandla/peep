import { describe, it, expect } from "vitest";
import { parseYouTubeId, embedUrl, watchUrl } from "../fraud/youtube";
import { heuristicAnalysis, parseFraudJson } from "../fraud/analyzer";
import { MAX_DURATION_SEC, SEVERITIES, VERDICTS, type VideoMeta } from "../fraud/types";

function meta(id: string, durationSec: number | null = 90): VideoMeta {
  return { id, url: watchUrl(id), title: `clip ${id}`, author: "ch", durationSec, thumbnail: "t" };
}

describe("parseYouTubeId", () => {
  it("parses watch URLs", () => {
    expect(parseYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://youtube.com/watch?v=dQw4w9WgXcQ&t=10s")).toBe("dQw4w9WgXcQ");
  });
  it("parses youtu.be short links", () => {
    expect(parseYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("youtu.be/dQw4w9WgXcQ?si=abc")).toBe("dQw4w9WgXcQ");
  });
  it("parses shorts and embed paths", () => {
    expect(parseYouTubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("accepts a bare 11-char id", () => {
    expect(parseYouTubeId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("rejects non-YouTube and malformed input", () => {
    expect(parseYouTubeId("https://vimeo.com/12345")).toBeNull();
    expect(parseYouTubeId("not a url")).toBeNull();
    expect(parseYouTubeId("")).toBeNull();
    expect(parseYouTubeId("https://www.youtube.com/watch?v=tooShort")).toBeNull();
  });
});

describe("url helpers", () => {
  it("builds embed and watch urls", () => {
    expect(embedUrl("abc12345678")).toBe("https://www.youtube.com/embed/abc12345678");
    expect(watchUrl("abc12345678")).toContain("watch?v=abc12345678");
  });
});

describe("heuristicAnalysis", () => {
  it("returns a valid, well-formed report", () => {
    const r = heuristicAnalysis(meta("aaaaaaaaaaa"));
    expect(VERDICTS).toContain(r.verdict);
    expect(r.riskScore).toBeGreaterThanOrEqual(0);
    expect(r.riskScore).toBeLessThanOrEqual(100);
    expect(r._mode).toBe("heuristic");
    expect(r.framesSampled).toBeGreaterThan(0);
    for (const f of r.findings) {
      expect(SEVERITIES).toContain(f.severity);
      expect(f.at).toMatch(/^\d+:\d{2}$/);
    }
  });

  it("is deterministic per video id", () => {
    const a = heuristicAnalysis(meta("zzzzzzzzzzz"));
    const b = heuristicAnalysis(meta("zzzzzzzzzzz"));
    expect(a).toEqual(b);
  });

  it("keeps finding timestamps within the clip duration", () => {
    const dur = 60;
    const r = heuristicAnalysis(meta("bbbbbbbbbbb", dur));
    for (const f of r.findings) {
      const [m, s] = f.at.split(":").map(Number);
      expect(m * 60 + s).toBeLessThanOrEqual(dur);
    }
  });

  it("handles unknown duration without throwing", () => {
    expect(() => heuristicAnalysis(meta("ccccccccccc", null))).not.toThrow();
  });
});

describe("parseFraudJson", () => {
  it("parses a clean model response", () => {
    const out = parseFraudJson(
      JSON.stringify({
        verdict: "fraud_detected",
        risk_score: 88,
        summary: "theft",
        findings: [{ at: "0:30", label: "grab", severity: "high", description: "took it" }],
      }),
    );
    expect(out?.verdict).toBe("fraud_detected");
    expect(out?.riskScore).toBe(88);
    expect(out?.findings[0].severity).toBe("high");
  });

  it("strips markdown fences", () => {
    const out = parseFraudJson('```json\n{"verdict":"clean","risk_score":3,"summary":"ok","findings":[]}\n```');
    expect(out?.verdict).toBe("clean");
    expect(out?.riskScore).toBe(3);
  });

  it("coerces bad fields to safe defaults", () => {
    const out = parseFraudJson(
      JSON.stringify({ verdict: "weird", risk_score: 999, findings: [{ severity: "nope" }] }),
    );
    expect(out?.verdict).toBe("suspicious");
    expect(out?.riskScore).toBe(100);
    expect(out?.findings[0].severity).toBe("warning");
  });

  it("returns null on non-JSON", () => {
    expect(parseFraudJson("definitely not json")).toBeNull();
  });
});

describe("constants", () => {
  it("caps duration at 3 minutes", () => {
    expect(MAX_DURATION_SEC).toBe(180);
  });
});
