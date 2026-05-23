// Agentic Camera — browser agent + mock target host.
//
// Two responsibilities:
//   1. Serve the mock Amazon page at http://localhost:8787/mock-amazon/
//   2. POST /run  → drive Playwright through the refund flow, return a receipt.
//
// Designed to be called by the in-browser orchestration agent.
//
// Run:
//   cd agentic-server && npm install && npx playwright install chromium && npm start

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { chromium } from 'playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const MOCK_BASE = `http://localhost:${PORT}/mock-amazon/`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type',
};

async function serveStatic(req, res) {
  // Map /mock-amazon/anything → mock-amazon/index.html (SPA fallback).
  const url = new URL(req.url, 'http://x');
  let path = url.pathname.replace(/^\/mock-amazon\/?/, '') || 'index.html';
  if (!extname(path)) path = 'index.html';
  try {
    const file = await readFile(join(__dirname, 'mock-amazon', path));
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'text/plain', ...CORS });
    res.end(file);
  } catch {
    res.writeHead(404, CORS); res.end('not found');
  }
}

async function runRefund({ event }) {
  const browser = await chromium.launch({ headless: process.env.HEADLESS !== 'false' });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  try {
    await page.goto(MOCK_BASE + 'login');
    await page.fill('#email', 'jamie@hello.com');
    await page.fill('#password', 'hunter2');
    await page.click('button[type=submit]');
    await page.waitForURL(/orders$/);

    // Pick the first order, request refund.
    await page.click('a[data-id]');
    await page.waitForSelector('#refundBtn');
    await page.click('#refundBtn');

    await page.waitForSelector('#rf');
    await page.selectOption('#reason', 'package_stolen');
    await page.fill('#notes',
      `Auto-filed by Peep · event ${event.event_type} @ ` +
      `${new Date(event.timestamp).toISOString()} (conf ${event.confidence.toFixed(2)})`);
    await page.click('button[type=submit]');

    await page.waitForSelector('#receiptText');
    const receiptText = await page.textContent('#receiptText');
    const receipt = JSON.parse(receiptText);
    return { ok: true, receipt };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    await browser.close();
  }
}

const WORKFLOWS = {
  file_amazon_refund:    runRefund,
  file_missing_delivery: runRefund,    // same flow, reason field would differ
};

async function handleRun(req, res) {
  let body = '';
  req.on('data', c => body += c);
  req.on('end', async () => {
    try {
      const { workflow, event } = JSON.parse(body || '{}');
      const fn = WORKFLOWS[workflow];
      if (!fn) {
        res.writeHead(400, { 'Content-Type': 'application/json', ...CORS });
        return res.end(JSON.stringify({ ok: false, error: 'unknown workflow: ' + workflow }));
      }
      console.log(`[browser-agent] running ${workflow} for ${event?.event_type}`);
      const result = await fn({ event });
      console.log(`[browser-agent] → ${result.ok ? 'OK' : 'FAIL'} ${result.error || result.receipt?.id}`);
      res.writeHead(result.ok ? 200 : 500, { 'Content-Type': 'application/json', ...CORS });
      res.end(JSON.stringify(result));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json', ...CORS });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS); return res.end(); }
  if (req.url === '/health') { res.writeHead(200, CORS); return res.end('ok'); }
  if (req.method === 'POST' && req.url === '/run') return handleRun(req, res);
  if (req.url.startsWith('/mock-amazon')) return serveStatic(req, res);
  res.writeHead(404, CORS); res.end('not found');
});

server.listen(PORT, () => {
  console.log(`[agentic-server] listening on :${PORT}`);
  console.log(`[agentic-server] mock target: ${MOCK_BASE}`);
});
