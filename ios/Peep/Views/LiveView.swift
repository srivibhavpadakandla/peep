import SwiftUI

struct LiveView: View {
    @EnvironmentObject private var appState: AppState
    @State private var talkActive    = false
    @State private var snapshotFlash = false
    @State private var muteOn        = false
    @State private var pulse         = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    cameraFeed
                    StatusStrip()
                        .padding(.horizontal, 20)
                    quickActions
                        .padding(.horizontal, 20)
                    if let active = appState.activeEvent {
                        activeCard(for: active)
                            .padding(.horizontal, 20)
                    }
                    Spacer(minLength: 24)
                }
                .padding(.top, 8)
            }
            .navigationTitle("Live")
            .navigationBarTitleDisplayMode(.large)
            .background(Color(.systemBackground))
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                pulse = true
            }
        }
    }

    // MARK: - Camera feed

    private var cameraFeed: some View {
        ZStack(alignment: .topLeading) {
            Rectangle()
                .fill(Color.black)
                .aspectRatio(16/9, contentMode: .fit)

            // Top-left LIVE pill
            HStack(spacing: 6) {
                Circle()
                    .fill(Color.peepAccent)
                    .frame(width: 8, height: 8)
                    .opacity(pulse ? 0.5 : 1.0)
                Text("LIVE")
                    .font(.system(.caption, design: .monospaced).weight(.semibold))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial, in: Capsule())
            .padding(12)
        }
        .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        .padding(.horizontal, 20)
    }

    // MARK: - Quick actions

    private var quickActions: some View {
        HStack(spacing: 12) {
            QuickActionCard(
                icon: "waveform",
                title: "Talk",
                isOn: talkActive
            ) {
                talkActive.toggle()
            }
            QuickActionCard(
                icon: "camera.fill",
                title: "Snapshot",
                isOn: snapshotFlash
            ) {
                snapshotFlash = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                    snapshotFlash = false
                }
            }
            QuickActionCard(
                icon: muteOn ? "bell.slash.fill" : "bell.slash",
                title: muteOn ? "Muted 1h" : "Mute alerts 1h",
                isOn: muteOn
            ) {
                muteOn.toggle()
                if muteOn {
                    appState.muteAlerts(for: 3600)
                } else {
                    appState.alertsMutedUntil = nil
                }
            }
        }
    }

    // MARK: - Active event card

    private func activeCard(for event: Event) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                Text("Active right now")
                    .font(.caption.weight(.semibold))
                    .tracking(0.5)
                    .foregroundStyle(.secondary)
                Spacer()
                SeverityBadge(severity: event.severity)
            }

            HStack(alignment: .top, spacing: 12) {
                Text(event.eventType.emoji)
                    .font(.system(size: 28))
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.eventType.label)
                        .font(.title3.weight(.semibold))
                    if let action = event.eventType.autoAction {
                        Text(action + ". Tap to review →")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer()
            }

            NavigationLink {
                EventDetailView(event: event)
            } label: {
                HStack {
                    Text("View")
                        .font(.body.weight(.semibold))
                    Spacer()
                    Image(systemName: "arrow.right")
                        .font(.body.weight(.semibold))
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.peepAccent, in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                .foregroundStyle(.black)
            }
            .buttonStyle(.plain)
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .stroke(event.severity.color.opacity(0.6), lineWidth: 1.5)
        )
    }
}

// MARK: - QuickActionCard

private struct QuickActionCard: View {
    let icon: String
    let title: String
    let isOn: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(alignment: .leading, spacing: 14) {
                Image(systemName: icon)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(isOn ? Color.black : Color.peepAccent)
                    .frame(width: 32, height: 32)
                    .background(
                        Circle().fill(isOn ? Color.peepAccent : Color.peepAccent.opacity(0.15))
                    )
                Text(title)
                    .font(.footnote.weight(.semibold))
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.leading)
                    .lineLimit(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Color(.secondarySystemBackground))
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .stroke(isOn ? Color.peepAccent.opacity(0.6) : .clear, lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    LiveView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
