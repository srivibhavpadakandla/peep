import { describe, it, expect } from "vitest";
import { parseDecision } from "../orchestration/gemini-router";

describe("parseDecision", () => {
  it("parses raw JSON", () => {
    const d = parseDecision('{"workflow":"amazon_refund_claim","reason":"x","params":{"order_id":"1"}}');
    expect(d.workflow).toBe("amazon_refund_claim");
    expect(d.reason).toBe("x");
  });
  it("strips markdown fences", () => {
    const d = parseDecision('```json\n{"workflow":"log_incident","reason":"y","params":{}}\n```');
    expect(d.workflow).toBe("log_incident");
  });
  it("rejects unknown workflow", () => {
    expect(() => parseDecision('{"workflow":"hack_the_planet","reason":"x","params":{}}')).toThrow();
  });
  it("rejects missing reason", () => {
    expect(() => parseDecision('{"workflow":"no_action","params":{}}')).toThrow();
  });
  it("rejects non-JSON", () => {
    expect(() => parseDecision("sorry, I can't do that, Dave")).toThrow();
  });
});
