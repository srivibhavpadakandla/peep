import SwiftUI

/// Tab shell. Four tabs — Live, Activity, Inbox, Settings. The tab bar uses
/// a translucent material against the cream background; active state is the
/// sage accent + bolder glyph.
struct RootView: View {
    init() {
        // Tab bar — translucent cream backdrop
        let tab = UITabBarAppearance()
        tab.configureWithDefaultBackground()
        tab.backgroundColor = UIColor(Color.peepBg.opacity(0.94))
        UITabBar.appearance().standardAppearance = tab
        UITabBar.appearance().scrollEdgeAppearance = tab

        // Nav bar — cream backdrop, dark plum titles
        let nav = UINavigationBarAppearance()
        nav.configureWithTransparentBackground()
        nav.backgroundColor = UIColor(Color.peepBg)
        nav.largeTitleTextAttributes = [.foregroundColor: UIColor(Color.peepText)]
        nav.titleTextAttributes = [.foregroundColor: UIColor(Color.peepText)]
        UINavigationBar.appearance().standardAppearance = nav
        UINavigationBar.appearance().scrollEdgeAppearance = nav
    }

    var body: some View {
        TabView {
            LiveView()
                .tabItem { Label("Live", systemImage: "house") }
            ActivityView()
                .tabItem { Label("Activity", systemImage: "bell") }
            InboxView()
                .tabItem { Label("Inbox", systemImage: "tray") }
            SettingsView()
                .tabItem { Label("Settings", systemImage: "gearshape") }
        }
        .tint(Color.peepAccent)
    }
}

#Preview {
    RootView()
        .environmentObject(AppState())
        .preferredColorScheme(.light)
}
