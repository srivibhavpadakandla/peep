import SwiftUI

/// Live view — the at-rest face of the app. Status sentence at top, calm
/// active-event card (only when something is happening), then a hero camera
/// frame at the bottom. Camera footage stays dark intentionally — it's
/// literal nighttime CCTV.
struct LiveView: View {
    @EnvironmentObject private var appState: AppState
    @State private var pulse = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.peepBg.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 24) {
                        // Title block
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Peep")
                                .font(.system(size: 28, weight: .medium))
                                .foregroundStyle(Color.peepText)
                            StatusStrip()
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 8)

                        if let active = appState.activeEvent {
                            activeCard(for: active)
                                .padding(.horizontal, 16)
                        }

                        cameraFeed
                            .padding(.horizontal, 16)

                        quickActions
                            .padding(.horizontal, 20)

                        Spacer(minLength: 80)
                    }
                }
            }
            .navigationBarHidden(true)
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) { pulse = true }
        }
    }

    // ───── Active card — calm white surface with a single sage CTA ─────
    private func activeCard(for event: Event) -> some View {
        NavigationLink { EventDetailView(event: event) } label: {
            VStack(alignment: .leading, spacing: 14) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Active right now")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.peepTextSec)
                    Spacer()
                    SeverityBadge(severity: event.severity)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text(event.eventType.label)
                        .font(.system(size: 22, weight: .medium))
                        .foregroundStyle(Color.peepText)
                    if let action = event.eventType.autoAction {
                        Text(action + ". Tap to review →")
                            .font(.system(size: 15))
                            .foregroundStyle(Color.peepTextSec)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                HStack(spacing: 8) {
                    Text("Review")
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Color.peepAccent)
                    Image(systemName: "arrow.right")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(Color.peepAccent)
                }
                .padding(.top, 2)
            }
            .padding(18)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color.peepSurface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .strokeBorder(Color.peepSep, lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
    }

    // ───── Camera feed — stays dark on purpose (nighttime CCTV) ────────
    private var cameraFeed: some View {
        ZStack(alignment: .topLeading) {
            Rectangle().fill(Color(red: 0.08, green: 0.08, blue: 0.10))
                .aspectRatio(16/9, contentMode: .fit)
            HStack(spacing: 6) {
                Circle()
                    .fill(Color.peepAccent)
                    .frame(width: 7, height: 7)
                    .opacity(pulse ? 0.5 : 1.0)
                Text("LIVE")
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial, in: Capsule())
            .padding(12)
        }
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    // ───── Quick actions — text-first, no colored chips ───────────────
    private var quickActions: some View {
        HStack(spacing: 0) {
            QuickActionButton(label: "Talk") {}
            Spacer()
            QuickActionButton(label: "Snapshot") {}
            Spacer()
            QuickActionButton(label: appState.alertsMuted ? "Muted" : "Mute 1h") {
                if appState.alertsMuted { appState.alertsMutedUntil = nil }
                else { appState.muteAlerts(for: 3600) }
            }
        }
    }
}

private struct QuickActionButton: View {
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.peepAccent)
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    LiveView()
        .environmentObject(AppState())
        .preferredColorScheme(.light)
}
