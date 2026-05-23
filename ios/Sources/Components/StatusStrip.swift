import SwiftUI

struct StatusStrip: View {
    @EnvironmentObject private var appState: AppState

    private var message: String {
        let pending = appState.pendingDeliveries.count
        if pending == 0 {
            return "All quiet."
        } else if pending == 1 {
            return "Watching · 1 delivery expected today"
        } else {
            return "Watching · \(pending) deliveries expected today"
        }
    }

    var body: some View {
        HStack(spacing: 10) {
            Circle()
                .fill(Color.peepAccent)
                .frame(width: 6, height: 6)
                .overlay(
                    Circle()
                        .stroke(Color.peepAccent.opacity(0.4), lineWidth: 4)
                        .scaleEffect(1.6)
                )
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.primary)
            Spacer()
            if appState.alertsMuted {
                Label("Muted", systemImage: "bell.slash.fill")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

#Preview {
    StatusStrip()
        .environmentObject(AppState())
        .padding()
        .preferredColorScheme(.dark)
}
