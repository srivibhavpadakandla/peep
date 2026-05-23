# Peep — iOS App Prompt (SwiftUI)

Paste the block below into Claude. Output: a single, paste-into-Xcode
SwiftUI project that compiles and runs on iOS 17+.

---

## The prompt

Build the iOS companion app for **Peep** as a complete, working SwiftUI project. I should be able to open Xcode, paste your files in, and run on a simulator without modification. Target iOS 17+. No external dependencies — SwiftUI + Foundation + Combine + AVKit only.

### What Peep is (product context — read this carefully)

Peep is an AI doorstep camera. Three agents work together: a vision agent watches the live feed, Claude reasons about what it sees, and a browser agent autonomously acts on third-party sites (files refunds, reports missing deliveries). When the camera sees a package get stolen, Peep has already filed the refund claim before the owner even pulls out their phone. The app is the user's window into a system that's already handling things for them — not a remote control.

### The events Peep emits (these are real backend types)

| Event | Severity | Auto-action |
|---|---|---|
| `package_arrived` | info | none |
| `package_taken` | critical | files Amazon refund (`reason=package_stolen`) |
| `package_not_arrived` | high | files Amazon claim (`reason=never_arrived`) |
| `person_loitering` | warning | logs alert |
| `multiple_loitering` | high | logs alert |
| `weapon_detected` | critical | logs alert |
| `after_hours_activity` | warning | logs alert |
| `animal_detected` | info / high (bear=high) | logs alert |

Each event has: `id`, `eventType`, `timestamp`, `confidence` (0–1), `clipURL`, and `metadata` (dictionary, optional).

### Project structure (use exactly this layout)

```
PeepApp.swift           // @main, App entry
RootView.swift          // TabView container, 4 tabs
Models/
  Event.swift           // Event, EventType (enum), Severity (enum), CodableMeta
  ExpectedDelivery.swift
  AppState.swift        // ObservableObject — single source of truth, seeded with mock data
Views/
  LiveView.swift        // tab 1 — Home / Live feed
  ActivityView.swift    // tab 2 — Events feed
  EventDetailView.swift // pushed when tapping a feed row
  InboxView.swift       // tab 3 — Expected deliveries
  SettingsView.swift    // tab 4 — preferences
Components/
  EventRow.swift        // reusable row for ActivityView
  SeverityBadge.swift   // pill rendering Severity
  StatusStrip.swift     // "All quiet · 2 pending · quiet hours 22:00–05:00"
```

Keep models in their own files. Views may use private helpers in-file.

### Tab bar (TabView with 4 items, in this order)

1. **Live** — `house.fill`
2. **Activity** — `bell.fill`
3. **Inbox** — `tray.full.fill`
4. **Settings** — `gearshape.fill`

Use SF Symbols throughout. Never use emoji as primary iconography in chrome — only inside event-type icons inside the feed (📦 for arrivals, 🐕 for animals, etc., where they're playful and product-defining).

### Per-screen requirements

#### LiveView
- A `Rectangle` placeholder at the top with `.fill(.black)` representing the camera feed, 16:9, with a small overlay top-left: green dot + "LIVE" in monospaced caption.
- `StatusStrip` below: shows "All quiet" / "Watching · 2 deliveries expected today" depending on state.
- A horizontal row of three quick-action `Buttons` styled like iOS Wallet cards: "Talk" (waveform icon), "Snapshot" (camera icon), "Mute alerts 1h" (bell.slash icon). Toggle visual state when tapped — they don't need real implementations.
- "Active right now" card that conditionally renders if `appState.activeEvent != nil` (seed it with a `package_taken` so reviewers see it). Make this card pop — fills the width, severity-colored stroke, "View" button that navigates to `EventDetailView`.

#### ActivityView
- `NavigationStack` with title "Activity", large title style.
- `ScrollView` with `LazyVStack` of `EventRow`s.
- Group by day via `Section` headers ("Today", "Yesterday").
- Seed the feed with at least 10 events spanning today + yesterday, covering **all eight event types** at least once (so the design has full surface area).
- Each `EventRow` is tappable, pushes `EventDetailView`. Use `.navigationDestination(for: Event.self)`.

#### EventDetailView
- Top: full-bleed black `Rectangle` 16:9 placeholder for the clip with `AVKit`-style play-button overlay (just the icon — no actual playback).
- Below: large title (event label), `SeverityBadge`, timestamp, confidence rendered as a thin horizontal `ProgressView`.
- **"What Peep did" card** — a vertically-stacked timeline of the orchestration trace as three rows:
  - "Vision agent · detected `\(eventType)` (conf \(confidence))"
  - "Orchestration · decided to \(decision)"
  - "Browser agent · \(outcome)"
  Each row has a small filled circle on the left and a vertical line connecting them (use a `ZStack` or `Path`).
- Action buttons at the bottom (in a horizontal `HStack` or `VStack` depending on count): "Mark resolved", "Report wrong", "Share clip". For critical events, add a destructive-style "Call police" button.

#### InboxView
- `List` of `ExpectedDelivery` cards. Each shows order ID (monospaced), item description, and a tap-to-toggle pill: "Pending" (amber) ↔ "Received" (green).
- Empty state when nothing expected: a centered "tray.fill" SF Symbol in `.secondary` color and "No deliveries today. Peep is still watching." in the subtitle.
- Seed with 2 deliveries: one Anker charger, one Logitech mouse, both pending.

#### SettingsView
- Native iOS `Form` with grouped `Sections`:
  - **Notifications**: `Toggle` "Push alerts", `Toggle` "Critical only", `DatePicker(.hourAndMinute)` for quiet-hours start + end.
  - **Detection**: `Slider` for loitering threshold (1–15s, step 0.5), `Toggle` "Fire once per session", `Toggle` "Require movement".
  - **Animals**: a `ForEach` of `Toggle`s for Dog 🐕, Cat 🐈, Bird 🐦, Bear 🐻.
  - **Auto-actions**: `Toggle`s for "Auto-file refund on theft", "Auto-file claim on missing delivery", "Notify when expected package doesn't arrive".
  - **Integrations**: rows with leading icon, title, and `Text("Connected").foregroundStyle(.green)` or `Text("Connect").foregroundStyle(.accentColor)`. List: Amazon (Connected), Gmail (Connect), Police (Coming soon, `.secondary`).

### Visual language

- **Dark mode default.** `.preferredColorScheme(.dark)` at the root.
- **Accent color: emerald-ish green.** Define a single static color in `Color+Peep.swift`: `static let peepAccent = Color(red: 0.06, green: 0.72, blue: 0.51)`.
- **Severity colors** (define as static `Color` extensions):
  - `.critical` → red
  - `.high` → orange
  - `.warning` → amber/yellow
  - `.info` → sky/blue
- **Type:** SF Pro via `.system`. Large titles for screen names. **Monospaced** (`.font(.system(.body, design: .monospaced))`) ONLY for: order IDs, receipt IDs, confidence values, and clip URLs.
- **Spacing:** generous — `.padding()` defaults, and `.padding(.horizontal, 20)` inside cards. This is a calm product.
- **Materials:** `.regularMaterial` for cards on top of the camera feed if needed; otherwise use `.background(Color(.secondarySystemBackground))` for grouped surfaces.

### Tone

Peep is calm and competent. Microcopy should never be alarmist or marketing-speak.

- LiveView status when nothing's happening: "All quiet. Watching for 2 deliveries."
- After a refund auto-files: "Refund filed. Tap to review →"
- Loitering: "Someone's been at the door for 8 seconds."
- InboxView empty state: "No deliveries today. Peep is still watching."

### Acceptance criteria

- Compiles on Xcode 15 / iOS 17 simulator with **zero modifications**.
- All four tabs render with seed data populated.
- Tapping any event in ActivityView pushes EventDetailView (use `NavigationStack` + `.navigationDestination(for: Event.self)`).
- Toggling a pill in InboxView visually updates immediately (mutate the `@Published` array on `AppState`).
- All Settings toggles/sliders are bound to `@State` or `@AppStorage` and respond visually.
- Dark mode looks intentional, not "default dark".
- No external Swift package dependencies. No third-party fonts.

If you have to choose between "comprehensive" and "polished", choose polished. Pixel polish > feature count.

### Output format

Produce each file as a separate Swift code block, in this order:
`PeepApp.swift`, `RootView.swift`, then `Models/`, `Views/`, `Components/`, `Color+Peep.swift`. Don't wrap them in a single mega-file. Brief notes between files are fine; no marketing prose.
