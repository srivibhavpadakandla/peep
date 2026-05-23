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
  if (req.workflow === "security_alert") {
    return await postSecurityAlert(req, baseUrl);
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

async function postSecurityAlert(req: BrowserAgentRequest, baseUrl: string): Promise<BrowserAgentResult> {
  // baseUrl points at /amazon; derive the app origin from it.
  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    origin = "http://localhost:3000";
  }
  const url = `${origin}/api/security/alert`;
  const body = {
    event_type: req.params.event_type,
    confidence: req.params.confidence,
    meta: req.params,
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        workflow: req.workflow,
        error: data.error ?? `alert endpoint ${res.status}`,
        trace: [{ step: "post_alert", ok: false, ts: Date.now(), detail: url }],
      };
    }
    return {
      success: true,
      workflow: req.workflow,
      receipt_id: data.alert?.id,
      landed_url: url,
      trace: [{ step: "post_alert", ok: true, ts: Date.now(), detail: data.alert?.id ?? "(no id)" }],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      workflow: req.workflow,
      error: message,
      trace: [{ step: "post_alert", ok: false, ts: Date.now(), detail: message }],
    };
  }
}
