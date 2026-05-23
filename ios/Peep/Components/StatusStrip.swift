import SwiftUI

/// Calm one-line status: a small sage dot + plain-English sentence.
/// No card background — the strip floats in the page padding so it reads as
/// status, not as a UI element.
struct StatusStrip: View {
    @EnvironmentObject private var appState: AppState

    private var message: String {
        let pending = appState.pendingDeliveries.count
        if pending == 0 { return "All quiet." }
        if pending == 1 { return "Watching · 1 delivery expected today" }
        return "Watching · \(pending) deliveries expected today"
    }

    var body: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(Color.peepAccent)
                .frame(width: 7, height: 7)
            Text(message)
                .font(.system(size: 15))
                .foregroundStyle(Color.peepText)
            Spacer()
            if appState.alertsMuted {
                Text("Muted")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.peepTextSec)
            }
        }
    }
}

#Preview {
    StatusStrip()
        .environmentObject(AppState())
        .padding(20)
        .background(Color.peepBg)
}
