import SwiftUI

@main
struct PeepApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .preferredColorScheme(.light)
                .tint(.peepAccent)
        }
    }
}
