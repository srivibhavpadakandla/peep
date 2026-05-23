import SwiftUI

struct LiveView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var agent = AgenticClient.shared

    @State private var activeCameraId: String = "front"
    @State private var snapshots: [Snapshot] = []
    @State private var snapshotFlash: Bool = false
    @State private var talkHeld: Bool = false
    @State private var talkStart: Date? = nil
    @State private var muteOn: Bool = false
    @State private var showRewind: Bool = false
    @State private var pulse = false

    struct Cam: Identifiable, Equatable {
        let id: String, label: String, address: String
    }
    private let cameras: [Cam] = [
        Cam(id: "front",  label: "Front door", address: "142 Linden St"),
        Cam(id: "back",   label: "Back yard",  address: "Garden gate"),
        Cam(id: "garage", label: "Garage",     address: "East driveway"),
        Cam(id: "side",   label: "Side gate",  address: "West alley"),
    ]
    private var activeCamera: Cam {
        cameras.first(where: { $0.id == activeCameraId }) ?? cameras[0]
    }

    struct Snapshot: Identifiable, Equatable {
        let id = UUID()
        let time: String
        let camera: String
    }

    var body: some View {
        PeepScreen {
            ScrollView {
                VStack(spacing: 14) {
                    cameraSwitcher
                    cameraBlock.padding(.horizontal, 16)
                    statusBanner.padding(.horizontal, 16)
                    quickActions.padding(.horizontal, 16)
                    if !snapshots.isEmpty {
                        snapshotStrip
                    }
                    if let active = appState.activeEvent {
                        activeEventCard(for: active).padding(.horizontal, 16)
                    }
                    Spacer(minLength: 110)  // clear the tab bar
                }
                .padding(.top, 8)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.4).repeatForever(autoreverses: true)) {
                pulse.toggle()
            }
        }
    }

    // MARK: - Camera switcher

    private var cameraSwitcher: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(cameras) { c in
                    PeepPill(title: c.label, selected: c.id == activeCameraId) {
                        activeCameraId = c.id
                    }
                }
            }
            .padding(.horizontal, 16)
        }
    }

    // MARK: - Camera feed (real webcam for the "front" camera, scene otherwise)

    private var cameraBlock: some View {
        ZStack(alignment: .topLeading) {
            Group {
                if activeCameraId == "front" {
                    LiveCameraView()
                } else {
                    LinearGradient(
                        colors: [Color(white: 0.10), Color(white: 0.04)],
                        startPoint: .top, endPoint: .bottom
                    )
                }
            }
            .aspectRatio(16/9, contentMode: .fit)
            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))

            // Snapshot flash
            if snapshotFlash {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(Color.white.opacity(0.8))
                    .aspectRatio(16/9, contentMode: .fit)
                    .transition(.opacity)
            }

            // Top-left LIVE / Replay badge
            HStack(spacing: 6) {
                Circle().fill(Color.peepAccent).frame(width: 6, height: 6)
                    .opacity(pulse ? 0.5 : 1.0)
                Text(showRewind ? "Replay" : "Live")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 9).padding(.vertical, 4)
            .background(Capsule().fill(Color.black.opacity(0.45)))
            .padding(10)

            // Top-right Rewind 30s button
            HStack {
                Spacer()
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) { showRewind.toggle() }
                } label: {
                    Text("Rewind 30s")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white)
                        .padding(.horizontal, 9).padding(.vertical, 4)
                        .background(Capsule().fill(Color.black.opacity(0.45)))
                }
                .buttonStyle(.plain)
            }
            .padding(10)

            // Bottom-left address + label
            VStack {
                Spacer()
                HStack {
                    Text("\(activeCamera.address) · \(activeCamera.label)")
                        .font(.system(size: 11))
                        .foregroundStyle(Color.white.opacity(0.85))
                    Spacer()
                }
                .padding(10)
            }
        }
    }

    // MARK: - Status banner

    private var statusBanner: some View {
        let pending = appState.pendingDeliveries.count
        let message: String = {
            if appState.alertsMuted { return "Alerts muted" }
            if pending > 0 { return "Watching · \(pending) deliver\(pending == 1 ? "y" : "ies") expected today" }
            return "All quiet"
        }()
        return PeepSurface(padding: 14) {
            HStack {
                Text(message)
                    .font(.system(size: 14))
                    .foregroundStyle(Color.peepText)
                Spacer()
                if pending > 0 {
                    Text("View →")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.peepText)
                }
            }
        }
    }

    // MARK: - Quick actions (Talk / Snapshot / Mute)

    private var quickActions: some View {
        HStack(spacing: 8) {
            HoldToTalkButton(held: $talkHeld, start: $talkStart)
            snapshotButton
            muteButton
        }
    }

    private var snapshotButton: some View {
        Button {
            withAnimation(.easeOut(duration: 0.05)) { snapshotFlash = true }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                withAnimation(.easeIn(duration: 0.2)) { snapshotFlash = false }
            }
            let f = DateFormatter(); f.dateFormat = "HH:mm:ss"
            snapshots.insert(Snapshot(time: f.string(from: Date()),
                                      camera: activeCamera.label), at: 0)
            if snapshots.count > 12 { snapshots = Array(snapshots.prefix(12)) }
        } label: {
            quickLabel(systemName: "camera.fill",
                       title: snapshots.isEmpty ? "Snapshot" : "Snapshot · \(snapshots.count)")
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity)
    }

    private var muteButton: some View {
        Button {
            muteOn.toggle()
            if muteOn { appState.muteAlerts(for: 3600) } else { appState.alertsMutedUntil = nil }
        } label: {
            quickLabel(systemName: muteOn ? "bell.slash.fill" : "bell.slash",
                       title: muteOn ? "Muted 1h" : "Mute",
                       active: muteOn)
        }
        .buttonStyle(.plain)
        .frame(maxWidth: .infinity)
    }

    private func quickLabel(systemName: String, title: String, active: Bool = false) -> some View {
        HStack(spacing: 8) {
            Image(systemName: systemName)
                .font(.system(size: 14, weight: .semibold))
            Text(title)
                .font(.system(size: 14, weight: .medium))
                .lineLimit(1)
                .minimumScaleFactor(0.85)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 12).padding(.vertical, 11)
        .foregroundStyle(active ? Color.peepBg : Color.peepText)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(active ? Color.peepText : Color.peepSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .stroke(Color.peepSep, lineWidth: active ? 0 : 0.5)
        )
    }

    // MARK: - Snapshot strip

    private var snapshotStrip: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("SNAPSHOTS · \(snapshots.count)")
                    .font(.system(size: 11, weight: .semibold))
                    .tracking(0.5)
                    .foregroundStyle(Color.peepTextSec)
                Spacer()
                Button("Clear") { snapshots.removeAll() }
                    .font(.system(size: 12))
                    .foregroundStyle(Color.peepTextSec)
            }
            .padding(.horizontal, 16)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 6) {
                    ForEach(snapshots) { s in
                        ZStack(alignment: .bottomTrailing) {
                            RoundedRectangle(cornerRadius: 8, style: .continuous)
                                .fill(Color.black)
                                .frame(width: 72, height: 54)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 8, style: .continuous)
                                        .stroke(Color.peepSep, lineWidth: 0.5)
                                )
                            Text(s.time)
                                .font(.system(size: 8, weight: .regular, design: .monospaced))
                                .foregroundStyle(.white)
                                .padding(.horizontal, 3)
                                .background(Color.black.opacity(0.6))
                                .cornerRadius(2)
                                .padding(3)
                        }
                    }
                }
                .padding(.horizontal, 16)
            }
        }
    }

    // MARK: - Active event card

    private func activeEventCard(for event: Event) -> some View {
        PeepSurface(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(event.eventType.label)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Color.peepText)
                    Spacer()
                    PeepSeverityBadge(severity: event.severity)
                }
                HStack(spacing: 8) {
                    Text(timeAgo(event.timestamp))
                        .font(.system(size: 13))
                        .foregroundStyle(Color.peepTextSec)
                    Text("·").foregroundStyle(Color.peepTextSec)
                    Text(String(format: "%.0f%% conf", event.confidence * 100))
                        .font(.system(size: 13, design: .monospaced))
                        .foregroundStyle(Color.peepTextSec)
                }
                if let auto = event.eventType.autoAction {
                    Text(auto)
                        .font(.system(size: 14))
                        .foregroundStyle(Color.peepText)
                        .fixedSize(horizontal: false, vertical: true)
                }
                if let status = agent.dispatches[event.id] {
                    DispatchStatusRow(status: status)
                }
                NavigationLink {
                    EventDetailView(event: event)
                } label: {
                    HStack {
                        Text("View receipt")
                            .font(.system(size: 14, weight: .semibold))
                        Spacer()
                        Image(systemName: "arrow.right")
                    }
                    .padding(.horizontal, 14).padding(.vertical, 11)
                    .foregroundStyle(Color.peepBg)
                    .background(
                        RoundedRectangle(cornerRadius: 10, style: .continuous)
                            .fill(Color.peepText)
                    )
                }
                .buttonStyle(.plain)
                .padding(.top, 4)
            }
        }
    }

    private func timeAgo(_ date: Date) -> String {
        let s = Int(Date().timeIntervalSince(date))
        if s < 60 { return "just now" }
        if s < 3600 { return "\(s/60)m ago" }
        return "\(s/3600)h ago"
    }
}

// MARK: - Dispatch status row

private struct DispatchStatusRow: View {
    let status: DispatchStatus

    var body: some View {
        HStack(spacing: 8) {
            indicator
            Text(label)
                .font(.system(size: 12, weight: .medium))
                .foregroundStyle(Color.peepText)
            Spacer(minLength: 8)
            if case .done(let r) = status {
                Text(r.id)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Color.peepAccent)
                    .lineLimit(1)
                    .truncationMode(.middle)
            }
        }
        .padding(.horizontal, 10).padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(Color.peepSurface2)
        )
    }

    @ViewBuilder private var indicator: some View {
        switch status {
        case .queued, .dispatched:
            ProgressView().scaleEffect(0.6).frame(width: 12, height: 12)
        case .done:    Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.peepAccent)
        case .failed:  Image(systemName: "xmark.circle.fill").foregroundStyle(Color.severityCritical)
        case .skipped: Image(systemName: "circle.dashed").foregroundStyle(Color.peepTextSec)
        }
    }

    private var label: String {
        switch status {
        case .queued:           return "Browser agent queued"
        case .dispatched:       return "Filing refund with browser agent…"
        case .done:             return "Refund filed"
        case .failed(let msg):  return "Action failed · \(msg)"
        case .skipped(let why): return "No action · \(why)"
        }
    }
}

// MARK: - Hold-to-talk

private struct HoldToTalkButton: View {
    @Binding var held: Bool
    @Binding var start: Date?
    @State private var elapsed: TimeInterval = 0
    @State private var timer: Timer?

    var body: some View {
        Text(held ? String(format: "Speaking · %.1fs", elapsed) : "Hold to talk")
            .font(.system(size: 14, weight: .medium))
            .lineLimit(1)
            .minimumScaleFactor(0.85)
            .padding(.horizontal, 12).padding(.vertical, 11)
            .frame(maxWidth: .infinity)
            .foregroundStyle(held ? Color.peepBg : Color.peepText)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(held ? Color.peepText : Color.peepSurface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(Color.peepSep, lineWidth: held ? 0 : 0.5)
            )
            .scaleEffect(held ? 0.98 : 1.0)
            .gesture(
                LongPressGesture(minimumDuration: 0.01)
                    .onChanged { _ in start = Date() }
                    .onEnded   { _ in start = Date() }
                    .sequenced(before: DragGesture(minimumDistance: 0).onEnded { _ in
                        held = false
                        timer?.invalidate(); timer = nil
                    })
                    .onChanged { _ in
                        if !held {
                            held = true
                            start = Date()
                            elapsed = 0
                            timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
                                if let s = start { elapsed = Date().timeIntervalSince(s) }
                            }
                        }
                    }
            )
    }
}

#Preview {
    LiveView()
        .environmentObject(AppState())
        .preferredColorScheme(.light)
}
