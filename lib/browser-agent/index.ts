import { chromium } from "playwright";
import { runAmazonRefundClaim } from "./refund";
import type { BrowserAgentRequest, BrowserAgentResult } from "./types";

export async function runBrowserAgent(req: BrowserAgentRequest): Promise<BrowserAgentResult> {
  const headed = process.env.BROWSER_AGENT_HEADED !== "0";
  const baseUrl =
    req.baseUrl ??
    process.env.SIMULATED_AMAZON_BASE_URL ??
    "http://localhost:3000/amazon";

  if (req.workflow === "log_incident") {
    return {
      success: true,
      workflow: req.workflow,
      receipt_id: `INCIDENT-${Date.now()}`,
      trace: [{ step: "log_only", ok: true, ts: Date.now(), detail: JSON.stringify(req.params) }],
    };
  }
  if (req.workflow === "no_action") {
    return {
      success: true,
      workflow: req.workflow,
      trace: [{ step: "no_action", ok: true, ts: Date.now() }],
    };
  }

  const browser = await chromium.launch({ headless: !headed });
  try {
    if (req.workflow === "amazon_refund_claim") {
      return await runAmazonRefundClaim(browser, req, baseUrl);
    }
    return {
      success: false,
      workflow: req.workflow,
      error: `unknown workflow: ${req.workflow}`,
      trace: [{ step: "dispatch", ok: false, ts: Date.now(), detail: "no handler" }],
    };
  } finally {
    await browser.close();
  }
}

export type { BrowserAgentRequest, BrowserAgentResult } from "./types";
