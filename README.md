# Peep · Agentic Camera

A live camera that watches for a real-world event, decides what to do about it,
and carries out the task on a website end-to-end — no human in the loop.

**Demo flow:** a `backpack` (stand-in package) is taken from in front of the camera →
the vision agent emits a `package_taken` event → Claude routes it to the
`amazon_refund_claim` workflow → the browser agent drives a simulated Amazon
checkout and returns a receipt.

---

## Architecture — three isolated agents, one locked contract

```
  ┌──────────────┐    CameraEvent     ┌────────────────┐  Decision   ┌──────────────────┐
  │ Vision Agent │ ─────────────────▶ │ Orchestration  │ ──────────▶ │ Browser Agent     │
  │  (browser)   │  Zustand store +   │  (Claude API)  │  fetch /api │  (Playwright)     │
  │              │  fetch /api        │                │             │                   │
  └──────────────┘                    └────────────────┘             └──────────────────┘
                                                                              │
                                                                              ▼
                                                                    ┌──────────────────┐
                                                                    │ Simulated Amazon │
                                                                    │  /amazon/*       │
                                                                    └──────────────────┘
```

The event contract is the single integration point and is **immutable**:

```ts
// lib/contract.ts
interface CameraEvent {
  event_type: "package_taken" | "package_arrived" | "person_loitering";
  timestamp: number;          // unix ms
  confidence: number;         // [0, 1]
  evidence_clip: {
    url: string;              // blob: / https: / file: — opaque to consumers
    duration_ms: number;
    mime_type: string;        // e.g. "video/webm"
  };
}
```

`isCameraEvent(value)` validates any payload crossing an agent boundary.

### Why these tradeoffs

| Decision | Why |
|---|---|
| **Next.js + Zustand on the client, HTTP for Playwright** | Vision and orchestration can be in-process for a 12-hour build; Playwright *must* run in Node, so that boundary already needs HTTP — and HTTP routes give us a real integration test surface for the contract. |
| **COCO-SSD as the default detector** | Hackathon-grade reliability. The `Detector` interface is swappable — replace with YOLOv8 ONNX once you've sourced a model file. |
| **Mock orchestration router when no API key** | The full pipeline runs offline. Set `ANTHROPIC_API_KEY` to flip to Claude. |
| **Blob URL `evidence_clip`** | MediaRecorder gives a rolling buffer that finalizes in-place — no server round-trip, no disk writes, no cleanup. |

---

## Layout

```
app/
  page.tsx                       # demo cockpit (the only thing users see)
  layout.tsx
  amazon/                        # simulated target site
    layout.tsx
    login/page.tsx
    orders/page.tsx
    refund/page.tsx
    receipt/page.tsx
  api/
    orchestrate/route.ts         # POST CameraEvent → OrchestrationDecision
    browser-agent/route.ts       # POST { workflow, params } → BrowserAgentResult
    amazon/refund/route.ts       # simulated target backend
components/
  VisionAgent.tsx                # camera + detector + event-detector + recorder
  DemoCockpit.tsx                # observes store, dispatches downstream calls
lib/
  contract.ts                    # the LOCKED event contract
  store.ts                       # Zustand pub/sub
  vision/
    detector.ts                  # Detector interface (swap detectors here)
    coco-ssd-detector.ts         # default impl, TFJS-based
    event-detector.ts            # pure state machine: detections → events
    clip-recorder.ts             # MediaRecorder rolling buffer
  orchestration/
    router.ts                    # OrchestrationRouter interface + MockRouter
    claude-router.ts             # ClaudeRouter (Sonnet 4.6)
    index.ts                     # picks Claude vs mock from env
  browser-agent/
    types.ts                     # request / result types
    refund.ts                    # the amazon_refund_claim workflow
    index.ts                     # dispatcher
  __tests__/                     # vitest unit tests per agent
```

---

## Run it

```bash
npm install
npx playwright install chromium      # only needed once; for the browser agent
cp .env.example .env.local           # optional — add ANTHROPIC_API_KEY for real Claude routing
npm run dev
```

Open <http://localhost:3000>. Allow camera access. Hold a backpack (or whatever
COCO class you picked from the dropdown) in frame for ~1 second, then move it
out of frame. You should see:

1. The phase indicator move `waiting → tracking → absent`.
2. A `package_taken` event appear in the **Last vision event** panel.
3. The **Orchestration decision** panel populate with `amazon_refund_claim`.
4. A new browser window pop open (headed mode) and drive through the simulated
   Amazon flow.
5. A receipt ID appear in the **Browser agent result** panel.

### Headless Playwright

```bash
BROWSER_AGENT_HEADED=0 npm run dev
```

### Run with a real Claude API key

```bash
echo 'ANTHROPIC_API_KEY=sk-ant-...' >> .env.local
npm run dev
```

The orchestration panel will show `via claude` instead of `via mock`.

---

## Per-agent input/output contracts

These are the contracts you'd hand a sibling builder so they can develop in
isolation against a mock.

### Vision agent
- **Input:** webcam stream + optional `targetLabel`.
- **Output:** publishes `CameraEvent` to the Zustand store via `publishEvent()`.
  Tests can substitute `detectorFactory` to feed synthetic detections.

### Orchestration agent
- **Input:** HTTP `POST /api/orchestrate` with a `CameraEvent` JSON body.
- **Output:** `{ workflow, reason, params, _mode }` JSON. `workflow` is one of
  `amazon_refund_claim | log_incident | no_action`. `_mode` is `"claude"` or
  `"mock"` so you can tell what answered.

### Browser agent
- **Input:** HTTP `POST /api/browser-agent` with `{ workflow, params, baseUrl? }`.
- **Output:** `BrowserAgentResult` JSON: `{ success, workflow, receipt_id?,
  landed_url?, screenshot_data_url?, error?, trace[] }`.

### Simulated Amazon (the target)
- `/amazon/login` — any credentials accepted, routes to `/amazon/orders`.
- `/amazon/orders` — two orders, each with `[data-order-id]` and a
  `.refund-cta` button (these are the Playwright selectors).
- `/amazon/refund?order_id=...` — form with `select[name=reason]`,
  `textarea[name=description]`, `input[name=evidence_confirmed]`,
  `button[type=submit]`.
- `/amazon/receipt?id=...` — confirmation page with `[data-receipt-id]`.

The DOM selectors above are part of the browser-agent ↔ target contract.
Don't rename them without updating `lib/browser-agent/refund.ts`.

---

## Tests

```bash
npm test
```

Covers what matters at the contract boundary:

- `contract.test.ts` — `isCameraEvent` accepts valid / rejects malformed.
- `event-detector.test.ts` — state machine: stable→absent emission, cooldown,
  flicker suppression, minScore gating, wrong-label gating.
- `mock-router.test.ts` — deterministic routing of every event type.
- `claude-router-parse.test.ts` — parser tolerates markdown fences, rejects
  unknown workflows / non-JSON / missing fields.

The vision-agent React component and the Playwright runner are *integration*
surfaces — exercise them via `npm run dev` rather than unit tests.

---

## Extending

- **New event type:** add it to `EventType` in `lib/contract.ts`, teach
  `EventDetector` to emit it, and add a case to `MockRouter` (and update the
  Claude system prompt in `claude-router.ts`).
- **New workflow:** add a handler in `lib/browser-agent/`, dispatch it from
  `lib/browser-agent/index.ts`, and add it to the `Workflow` union in
  `lib/orchestration/router.ts`. The orchestration agent will start routing to
  it once it appears in the system prompt.
- **Different detector:** implement `Detector` (see `coco-ssd-detector.ts` for
  shape), then pass `detectorFactory={() => new MyDetector()}` to
  `<VisionAgent />`.
