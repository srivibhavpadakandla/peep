# Agentic Camera — browser agent + mock target

Two responsibilities:
1. Serve the mock Amazon target page at `http://localhost:8787/mock-amazon/`.
2. Drive Playwright through the refund flow when called with `POST /run`.

## Setup

```bash
cd agentic-server
npm install
npx playwright install chromium
npm start            # listens on :8787
# HEADLESS=false npm start   # watch the browser drive the refund (great for the demo)
```

## Event contract

`POST /run` accepts the locked event contract from the in-browser orchestration
agent:

```json
{
  "workflow": "file_amazon_refund",
  "event": {
    "event_type":    "package_taken",
    "timestamp":     1741000000000,
    "confidence":    0.91,
    "evidence_clip": { "kind": "frame", "ref": "data:image/jpeg;base64,…" }
  }
}
```

Returns:

```json
{
  "ok": true,
  "receipt": {
    "id": "RFND-XQ7K9-PJZ4",
    "order_id": "AMZ-204-9183711-3322048",
    "reason": "package_stolen",
    "notes": "Auto-filed by Peep · event package_taken @ … (conf 0.91)",
    "issued_at": "2026-05-23T21:30:00.000Z",
    "status": "approved_pending_credit"
  }
}
```

## Integration

The in-browser orchestration agent posts to
`http://localhost:8787/run`. The mock target the agent operates on is served
by this same process, so the demo has no external dependencies.
