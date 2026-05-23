import SwiftUI

// Custom bottom tab bar matching the prototype: cream blurred backdrop,
// 5 stroke-style SF symbols, plum-on-cream colors. Replaces SwiftUI's
// system-styled TabView so the chrome matches the design.

enum PeepTab: String, CaseIterable, Identifiable {
    case live, activity, community, inbox, settings
    var id: String { rawValue }

    var label: String {
        switch self {
        case .live:      return "Live"
        case .activity:  return "Activity"
        case .community: return "Community"
        case .inbox:     return "Inbox"
        case .settings:  return "Settings"
        }
    }

    var icon: String {
        switch self {
        case .live:      return "house"
        case .activity:  return "bell"
        case .community: return "person.2"
        case .inbox:     return "tray"
        case .settings:  return "gearshape"
        }
    }

    var iconFilled: String { icon + ".fill" }
}

struct PeepTabBar: View {
    @Binding var selection: PeepTab

    var body: some View {
        HStack(spacing: 0) {
            ForEach(PeepTab.allCases) { tab in
                Button {
                    selection = tab
                } label: {
                    VStack(spacing: 3) {
                        Image(systemName: tab == selection ? tab.iconFilled : tab.icon)
                            .font(.system(size: 21, weight: tab == selection ? .semibold : .regular))
                        Text(tab.label)
                            .font(.system(size: 10, weight: tab == selection ? .semibold : .regular))
                    }
                    .foregroundStyle(tab == selection ? Color.peepText : Color.peepTextTer)
                    .frame(maxWidth: .infinity)
                    .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
            }
        }
        .padding(.top, 8)
        .padding(.bottom, 6)
        .background(
            Color.peepBg.opacity(0.94)
                .background(.ultraThinMaterial)
        )
        .overlay(alignment: .top) {
            Rectangle().fill(Color.peepSep).frame(height: 0.5)
        }
    }
}
