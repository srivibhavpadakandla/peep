import SwiftUI

struct EventDetailView: View {
    let event: Event
    @Environment(\.dismiss) private var dismiss
    @StateObject private var agent = AgenticClient.shared

    var body: some View {
        PeepScreen {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    heroClip
                    titleBlock.padding(.horizontal, 20)
                    confidenceBar.padding(.horizontal, 20)
                    whatPeepDid.padding(.horizontal, 16)
                    if let meta = event.metadata, !meta.isEmpty { detailsCard(meta).padding(.horizontal, 16) }
                    actions.padding(.horizontal, 16)
                    Spacer(minLength: 30)
                }
                .padding(.top, 4)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button {
                    dismiss()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "chevron.left").font(.system(size: 14, weight: .semibold))
                        Text("Back")
                    }
                    .foregroundStyle(Color.peepText)
                }
            }
        }
    }

    private var heroClip: some View {
        ZStack(alignment: .bottomTrailing) {
            Rectangle()
                .fill(Color.black)
                .aspectRatio(16/9, contentMode: .fit)
            Image(systemName: "play.fill")
                .font(.system(size: 28, weight: .semibold))
                .foregroundStyle(.white.opacity(0.95))
                .frame(width: 64, height: 64)
                .background(Circle().fill(Color.white.opacity(0.18)))
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            Text("peep://clips/\(String(event.id.uuidString.prefix(8))).mp4")
                .font(.system(size: 10, design: .monospaced))
                .foregroundStyle(Color.white.opacity(0.7))
                .padding(10)
        }
    }

    private var titleBlock: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(event.eventType.label)
                .font(.system(size: 30, weight: .semibold))
                .tracking(-0.5)
                .foregroundStyle(Color.peepText)
                .fixedSize(horizontal: false, vertical: true)
            HStack(spacing: 10) {
                PeepSeverityBadge(severity: event.severity)
                Text(timeStr)
                    .font(.system(size: 13))
                    .foregroundStyle(Color.peepTextSec)
            }
        }
    }

    private var confidenceBar: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text("Confidence")
                    .font(.system(size: 11, weight: .medium))
                    .foregroundStyle(Color.peepTextSec)
                Spacer()
                Text(String(format: "%.2f", event.confidence))
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Color.peepTextSec)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.peepSurface).frame(height: 3)
                    Capsule().fill(Color.peepAccent)
                        .frame(width: geo.size.width * event.confidence, height: 3)
                }
            }
            .frame(height: 3)
        }
    }

    private var whatPeepDid: some View {
        PeepSurface(padding: 18) {
            VStack(alignment: .leading, spacing: 14) {
                Text("What Peep did")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.peepText)
                ForEach(Array(timelineSteps.enumerated()), id: \.offset) { idx, step in
                    TimelineRow(title: step.title, subtitle: step.subtitle,
                                isLast: idx == timelineSteps.count - 1)
                }
            }
        }
    }

    private func detailsCard(_ meta: [String: CodableMeta]) -> some View {
        PeepSurface(padding: 16) {
            VStack(alignment: .leading, spacing: 8) {
                Text("Details")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(Color.peepText)
                ForEach(meta.sorted(by: { $0.key < $1.key }), id: \.key) { (k, v) in
                    HStack {
                        Text(humanize(k))
                            .font(.system(size: 13))
                            .foregroundStyle(Color.peepTextSec)
                        Spacer()
                        Text(v.displayValue)
                            .font(.system(size: 13, design: .monospaced))
                            .foregroundStyle(Color.peepText)
                    }
                }
            }
        }
    }

    private var actions: some View {
        VStack(spacing: 10) {
            PeepGhostButton(title: "Mark resolved", icon: "checkmark.circle") {}
            PeepGhostButton(title: "Report wrong",  icon: "exclamationmark.circle") {}
            PeepGhostButton(title: "Share clip",    icon: "square.and.arrow.up") {}
            if event.severity == .critical {
                PeepGhostButton(title: "Call police", icon: "phone.fill",
                                destructive: true) {}
            }
        }
    }

    // MARK: - Helpers

    private var timeStr: String {
        let f = DateFormatter()
        f.dateStyle = .medium; f.timeStyle = .short
        return f.string(from: event.timestamp)
    }

    private struct Step { let title, subtitle: String }
    private var timelineSteps: [Step] {
        let conf = String(format: "%.2f", event.confidence)
        switch event.eventType {
        case .packageTaken:
            let third: Step = {
                if case .done(let r) = agent.dispatches[event.id] {
                    return Step(title: "Browser agent",  subtitle: "receipt \(r.id)")
                }
                if case .dispatched = agent.dispatches[event.id] {
                    return Step(title: "Browser agent",  subtitle: "filing refund…")
                }
                if case .failed(let m) = agent.dispatches[event.id] {
                    return Step(title: "Browser agent",  subtitle: "failed · \(m)")
                }
                return Step(title: "Browser agent",  subtitle: "awaiting dispatch")
            }()
            return [
                Step(title: "Vision agent",   subtitle: "detected package_taken (conf \(conf))"),
                Step(title: "Orchestration",  subtitle: "decided to file refund"),
                third,
            ]
        case .packageNotArrived:
            return [
                Step(title: "Vision agent",   subtitle: "no delivery in expected window"),
                Step(title: "Orchestration",  subtitle: "decided to file missing-delivery claim"),
                Step(title: "Browser agent",  subtitle: "claim filed, monitoring"),
            ]
        case .weaponDetected:
            return [
                Step(title: "Vision agent",   subtitle: "weapon-like object detected (conf \(conf))"),
                Step(title: "Orchestration",  subtitle: "low confidence · escalating to human review"),
                Step(title: "Inbox",          subtitle: "awaiting your verdict"),
            ]
        default:
            return [
                Step(title: "Vision agent",   subtitle: "detected \(event.eventType.rawValue) (conf \(conf))"),
                Step(title: "Orchestration",  subtitle: "logged alert"),
                Step(title: "Done",           subtitle: "no automated action taken"),
            ]
        }
    }

    private func humanize(_ key: String) -> String {
        switch key {
        case "duration_s": return "Duration"
        case "carrier":    return "Carrier"
        case "order_id":   return "Order ID"
        case "species":    return "Species"
        case "object":     return "Object"
        case "count":      return "Count"
        default:           return key.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }
}

// MARK: - Timeline row

private struct TimelineRow: View {
    let title: String
    let subtitle: String
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            VStack(spacing: 0) {
                Circle().fill(Color.peepAccent).frame(width: 10, height: 10)
                if !isLast {
                    Rectangle().fill(Color.peepSep).frame(width: 1.5)
                        .frame(maxHeight: .infinity)
                        .padding(.top, 2)
                }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(Color.peepText)
                Text(subtitle)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Color.peepTextSec)
                    .padding(.bottom, isLast ? 0 : 6)
            }
            Spacer(minLength: 0)
        }
    }
}
