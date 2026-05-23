import SwiftUI

struct RootView: View {
    @State private var selection: PeepTab = .live

    var body: some View {
        ZStack(alignment: .bottom) {
            Group {
                switch selection {
                case .live:      LiveView()
                case .activity:  ActivityView()
                case .community: CommunityView()
                case .inbox:     InboxView()
                case .settings:  SettingsView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            PeepTabBar(selection: $selection)
        }
        .background(Color.peepBg.ignoresSafeArea())
    }
}

// Community is stubbed for now; matches the prototype's 5-tab layout.
private struct CommunityView: View {
    var body: some View {
        PeepScreen {
            VStack(spacing: 8) {
                Text("Community")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundStyle(Color.peepText)
                Text("Neighborhood feed coming soon.")
                    .font(.system(size: 14))
                    .foregroundStyle(Color.peepTextSec)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }
}

#Preview {
    RootView()
        .environmentObject(AppState())
        .preferredColorScheme(.light)
}
