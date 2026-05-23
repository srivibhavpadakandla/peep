import type { Browser, Page } from "playwright";
import type { BrowserAgentRequest, BrowserAgentResult, BrowserAgentTraceEntry } from "./types";

export async function runAmazonRefundClaim(
  browser: Browser,
  req: BrowserAgentRequest,
  baseUrl: string,
): Promise<BrowserAgentResult> {
  const trace: BrowserAgentTraceEntry[] = [];
  const step = (name: string, ok: boolean, detail?: string) => {
    trace.push({ step: name, ok, detail, ts: Date.now() });
  };

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  let landedUrl: string | undefined;
  let screenshot: string | undefined;

  try {
    await page.goto(`${baseUrl}/login`, { waitUntil: "domcontentloaded" });
    step("nav:login", true, page.url());

    await page.fill('input[name="email"]', "demo@cipher.test");
    await page.fill('input[name="password"]', "hackathon");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/orders$/, { timeout: 5000 });
    step("auth:login", true, page.url());

    const orderId = String(req.params.order_id ?? "112-7350199-0123456");
    await page.click(`[data-order-id="${orderId}"] button.refund-cta`);
    await page.waitForURL(/\/refund\?/, { timeout: 5000 });
    step("nav:refund", true, page.url());

    await page.selectOption('select[name="reason"]', "package_stolen");
    await page.fill('textarea[name="description"]', String(req.params.item_description ?? "Package taken on camera"));
    await page.check('input[name="evidence_confirmed"]');
    step("form:fill", true);

    await Promise.all([page.waitForURL(/\/receipt\?/, { timeout: 5000 }), page.click('button[type="submit"]')]);
    landedUrl = page.url();
    const receiptId = await page.locator("[data-receipt-id]").getAttribute("data-receipt-id");
    step("submit:receipt", !!receiptId, receiptId ?? "no receipt id");

    screenshot = await captureScreenshot(page);

    return {
      success: !!receiptId,
      workflow: req.workflow,
      receipt_id: receiptId ?? undefined,
      landed_url: landedUrl,
      screenshot_data_url: screenshot,
      trace,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    step("error", false, message);
    try {
      screenshot = await captureScreenshot(page);
    } catch {
      // best-effort
    }
    return {
      success: false,
      workflow: req.workflow,
      error: message,
      landed_url: page.url(),
      screenshot_data_url: screenshot,
      trace,
    };
  } finally {
    await context.close();
  }
}

async function captureScreenshot(page: Page): Promise<string> {
  const buf = await page.screenshot({ type: "png", fullPage: false });
  return `data:image/png;base64,${buf.toString("base64")}`;
}
