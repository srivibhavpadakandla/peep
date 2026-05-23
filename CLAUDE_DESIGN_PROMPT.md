# Peep — Claude Design Prompt

Paste the block below into Claude (claude.ai, with Artifacts enabled).
It produces a working interactive mobile-app design as a React + Tailwind
artifact that mirrors the actual Peep product.

---

## The prompt

Design the mobile companion app for **Peep** — an AI doorstep camera. Build it as a single, interactive React + Tailwind artifact, sized for a mobile viewport (390×844 — iPhone 15-class). Use shadcn/ui-style primitives, dark mode by default, system fonts, and motion only where it earns its keep.

### What Peep does (product context — important)

Peep is a doorstep camera with three AI agents working together:

1. **Vision agent** — runs YOLO/COCO-SSD detection on the live feed every frame.
2. **Orchestration agent** — Claude reasons about each detected event and decides what to do.
3. **Browser agent** — Playwright drives third-party websites (Amazon today; carrier portals, police-report sites later) to act on the user's behalf.

The user buys this camera, mounts it at their front door, and Peep handles the rest end-to-end. No human ever has to click "file a refund" — when the camera sees a package get stolen, Peep already filed it.

### The seven things Peep detects (these are real event types from the backend)

| Event | What happens | Severity |
|---|---|---|
| `package_arrived` | Delivery person dropped a package and walked away | info |
| `package_taken` | A person was near a resting package, then it vanished | critical (auto-files refund) |
| `package_not_arrived` | Inbox said it would arrive today, camera saw nothing | high (auto-files claim) |
| `person_loitering` | Someone hanging around the doorstep ≥5s | warning |
| `multiple_loitering` | 2+ people loitering together | high |
| `weapon_detected` | A knife / weapon visible on camera | critical |
| `after_hours_activity` | Anyone present during user's quiet hours | warning |
| `animal_detected` | Dog, cat, bird, or bear (bear = high) | info / high |

Each event has: timestamp, confidence (0–1), a 5-second video clip, and metadata.

### Screens to design

Build at minimum these screens, switchable via a bottom tab bar. Make tapping things actually change state — this is an interactive artifact, not static mockups.

1. **Home / Live**
   - Live camera feed (placeholder image with a faint "● LIVE" indicator).
   - Status row underneath: "Watching · 2 expected deliveries today · quiet hours: 22:00–05:00"
   - Quick-action chips: "Talk" (intercom), "Snapshot", "Mute alerts 1h"
   - The currently-active event badge if anything is happening right now ("📦 Package arriving" / "🚨 Person near doorstep")

2. **Activity feed**
   - Scrolling list of events, newest first. Group by day with sticky date headers.
   - Each row: severity-colored left stripe, event icon (📦 🚨 🐕 🔪 etc.), one-line label, timestamp, optional preview thumbnail.
   - Critical events (theft, weapon) should pop visually — bigger card, red accent, "Action taken" sub-line ("✓ Refund filed · Receipt RFND-XQ7K9-PJZ4").
   - Tapping a row opens the **Event detail** screen.

3. **Event detail**
   - Full-bleed video clip placeholder at top with scrubber.
   - Event title, severity badge, timestamp, confidence bar.
   - "What Peep did" card — shows the orchestration trace as a friendly timeline:
     "9:42 AM · Vision agent: package_taken (conf 0.81)"
     "9:42 AM · Claude: filed refund claim with Amazon"
     "9:42 AM · Browser agent: receipt RFND-XQ7K9-PJZ4"
   - Action buttons: "Mark as resolved", "Report wrong (false positive)", "Share clip", "Call police" (for critical only).

4. **Inbox / Expected today**
   - List of packages Peep is expecting today, parsed from the user's email.
   - Each row: order number, item description, "pending" or "received" pill.
   - Empty state when nothing expected: "No deliveries today. Peep is still watching."

5. **Settings**
   - **Notifications** — push toggle, critical-only override, quiet hours window (start/end pickers).
   - **Detection** — loitering dwell threshold slider (1–15s), "Fire once per session" toggle, "Require movement" toggle.
   - **Animals** — chip toggles for 🐕 dog, 🐈 cat, 🐦 bird, 🐻 bear.
   - **Auto-actions** — toggles for "Auto-file refund on theft", "Auto-file claim on missing delivery", "Notify when expected package doesn't arrive".
   - **Integrations** — Amazon (connected), Gmail (connect), Police (coming soon).

### Visual language

- **Dark theme by default.** True black or near-black (#0a0a0a) background. Surfaces step up in lightness (#171717, #262626).
- **One accent color for "Peep is working":** emerald-500. Use it sparingly — connection status dot, success ticks, primary CTAs.
- **Severity palette:**
  - critical → red-500
  - high → orange-500
  - warning → amber-400
  - info → sky-400
- **Type:** large, confident headlines (text-2xl bold for screen titles). System fonts. Use monospace ONLY for receipt IDs, order numbers, and confidence values.
- **Spacing:** generous. This is a calm product, not a dashboard.
- **No dashboards-y patterns.** No fake charts. No gradients. No glassmorphism. Think Linear / Things 3 / iOS Wallet, not Bloomberg Terminal.

### Tone in copy

Peep should feel like a calm, competent assistant that has things handled — never alarmed, never marketing-speak. Sample microcopy:

- Home status: "All quiet. Watching for 2 deliveries."
- After a refund auto-files: "Refund filed. Take a look →"
- Loitering: "Someone's been at the door for 8 seconds."
- Empty inbox: "No deliveries today. Peep is still watching."

### Interactive requirements

- Tab bar at bottom switches screens. Active state should be obvious.
- The Activity feed must contain ≥ 8 events spanning today and yesterday, covering ALL event types (so the design can be evaluated against real product surface area).
- Tapping an event in the feed must navigate to the Event detail screen (push transition or full-screen overlay — your call).
- The Inbox screen lets the user manually toggle a package between "pending" and "received" by tapping its pill.
- Settings sliders/toggles must visually respond (no need to persist).

### Output

A single React component as the artifact. No external dependencies beyond what claude.ai allows (React, Tailwind, lucide-react for icons). Make it actually feel like a shipping app — pixel polish counts.

If you have to choose between "comprehensive" and "polished", choose polished.
