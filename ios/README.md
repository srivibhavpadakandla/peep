# Peep iOS

Native SwiftUI companion app for the Peep doorstep camera. Five-tab structure
(Live · Activity · Inbox · Settings) with a calm light theme, sage-green accent,
and Inter-style system fonts. Sources only; the `.xcodeproj` is regenerated
from `project.yml`.

## Run it

```bash
brew install xcodegen           # one-time
cd ios
xcodegen generate
open Peep.xcodeproj
```

In Xcode: select an iPhone simulator (iPhone 15 or newer), press ⌘R. Requires
iOS 17+ and Xcode 15+.

## Layout

```
ios/
  project.yml                   # xcodegen spec
  Peep/
    PeepApp.swift               # @main, App entry
    RootView.swift              # TabView shell
    Color+Peep.swift            # accent + severity palette
    Models/
      AppState.swift            # @StateObject backing the whole app
      Event.swift               # Event + EventType + Severity
      ExpectedDelivery.swift
    Views/
      LiveView.swift            # current event + camera placeholder
      ActivityView.swift        # event feed grouped by day
      InboxView.swift           # expected deliveries
      EventDetailView.swift     # full per-event trace (pushed)
      SettingsView.swift        # connections, detection, integrations
    Components/
      EventRow.swift
      SeverityBadge.swift
      StatusStrip.swift
    owl-logo.svg                # brand mark
```

## Notes

- Everything is mock-state-driven via `AppState` so the build runs offline.
- The web console at `localhost:36533` and this iOS app are two front-ends to
  the same product; they share names + concepts but no code.
- To regenerate after editing `project.yml`: `cd ios && xcodegen generate`.
- To wipe and re-clone build: `rm -rf ios/Peep.xcodeproj && xcodegen generate`.
