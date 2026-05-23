import SwiftUI

/// Event detail — pushed from Activity. Calm light cards, text-only severity,
/// "What Peep did" as a thin three-step timeline. Camera clip placeholder
/// stays dark on purpose (CCTV footage).
struct EventDetailView: View {
    let event: Event

    private static let timestampFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f
    }()

    private var receiptID: String {
        let raw = event.id.uuidString
            .replacingOccurrences(of: "-", with: "")
            .prefix(8)
            .uppercased()
        return "RFND-\(raw.prefix(5))-\(raw.suffix(3))"
    }

    var body: some View {
        ZStack {
            Color.peepBg.ignoresSafeArea()
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    clipPlaceholder
                        .padding(.horizontal, 16)

                    VStack(alignment: .leading, spacing: 12) {
                        Text(event.eventType.label)
                            .font(.system(size: 26, weight: .medium))
                            .foregroundStyle(Color.peepText)
                            .fixedSize(horizontal: false, vertical: true)

                        HStack(spacing: 10) {
                            SeverityBadge(severity: event.severity)
                            Text("·").foregroundStyle(Color.peepTextTer)
                            Text(Self.timestampFormatter.string(from: event.timestamp))
                                .font(.system(size: 14))
                                .foregroundStyle(Color.peepTextSec)
                            Text("·").foregroundStyle(Color.peepTextTer)
                            Text("\(Int((event.confidence * 100).rounded()))% confidence")
                                .font(.system(size: 14))
                                .foregroundStyle(Color.peepTextSec)
                        }
                    }
                    .padding(.horizontal, 20)

                    whatPeepDid
                        .padding(.horizontal, 16)

                    if let meta = event.metadata, !meta.isEmpty {
                        metadataCard(meta: meta)
                            .padding(.horizontal, 16)
                    }

                    actions
                        .padding(.horizontal, 16)
                        .padding(.bottom, 24)
                }
                .padding(.top, 8)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }

    // ───── Clip placeholder (intentionally dark) ──────────────────────
    private var clipPlaceholder: some View {
        ZStack {
            Rectangle().fill(Color(red: 0.08, green: 0.08, blue: 0.10))
                .aspectRatio(16/9, contentMode: .fit)
            Circle()
                .fill(.ultraThinMaterial)
                .frame(width: 64, height: 64)
                .overlay(
                    Image(systemName: "play.fill")
                        .font(.system(size: 22, weight: .medium))
                        .foregroundStyle(.white)
                        .offset(x: 2)
                )
        }
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
    }

    // ───── What Peep did — white card with thin timeline ─────────────
    private var whatPeepDid: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("What Peep did")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color.peepText)

            VStack(alignment: .leading, spacing: 0) {
                TimelineStep(
                    title: "Spotted",
                    subtitle: "Detected \(event.eventType.label.lowercased()).",
                    isLast: false
                )
                TimelineStep(
                    title: "Decided",
                    subtitle: decisionLine,
                    isLast: false
                )
                TimelineStep(
                    title: "Done",
                    subtitle: browserLine,
                    isLast: true
                )
            }
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

    private var decisionLine: String {
        switch event.eventType {
        case .packageTaken: return "Filed Amazon refund."
        case .packageNotArrived: return "Filed Amazon 'never arrived' claim."
        case .weaponDetected: return "Escalated · awaiting human review."
        default: return "Logged alert."
        }
    }

    private var browserLine: String {
        switch event.eventType {
        case .packageTaken: return "Receipt \(receiptID)"
        case .packageNotArrived: return "Claim \(receiptID)"
        default: return "No action taken."
        }
    }

    // ───── Metadata card ─────────────────────────────────────────────
    private func metadataCard(meta: [String: CodableMeta]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Details")
                .font(.system(size: 16, weight: .medium))
                .foregroundStyle(Color.peepText)
            ForEach(meta.keys.sorted(), id: \.self) { key in
                HStack {
                    Text(humanizeKey(key))
                        .font(.system(size: 14))
                        .foregroundStyle(Color.peepTextSec)
                    Spacer()
                    Text(meta[key]?.displayValue ?? "—")
                        .font(.system(size: 14))
                        .foregroundStyle(Color.peepText)
                }
            }
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

    private func humanizeKey(_ key: String) -> String {
        switch key {
        case "duration_s": return "Duration"
        case "carrier": return "Carrier"
        case "species": return "Animal"
        case "count": return "People"
        case "object": return "Object"
        case "order_id": return "Order"
        default:
            return key.replacingOccurrences(of: "_", with: " ").capitalized
        }
    }

    // ───── Actions ───────────────────────────────────────────────────
    private var actions: some View {
        VStack(spacing: 8) {
            actionRow(title: "Mark resolved", destructive: false)
            actionRow(title: "Report wrong", destructive: false)
            actionRow(title: "Share clip", destructive: false)
            if event.severity == .critical {
                actionRow(title: "Call police", destructive: true)
            }
        }
    }

    private func actionRow(title: String, destructive: Bool) -> some View {
        Button(action: {}) {
            HStack {
                Text(title)
                    .font(.system(size: 15))
                Spacer()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Color.peepSurface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .strokeBorder(Color.peepSep, lineWidth: 0.5)
            )
            .foregroundStyle(destructive ? Color.severityCritical : Color.peepText)
        }
        .buttonStyle(.plain)
    }
}

// ───── Timeline step — small dot + thin connector line ────────────
private struct TimelineStep: View {
    let title: String
    let subtitle: String
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(spacing: 0) {
                Circle()
                    .fill(Color.peepAccent)
                    .frame(width: 8, height: 8)
                if !isLast {
                    Rectangle()
                        .fill(Color.peepSep)
                        .frame(width: 1)
                        .frame(maxHeight: .infinity)
                }
            }
            .frame(width: 10)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.peepText)
                Text(subtitle)
                    .font(.system(size: 14))
                    .foregroundStyle(Color.peepTextSec)
                    .fixedSize(horizontal: false, vertical: true)
            }
            .padding(.bottom, isLast ? 0 : 16)
            Spacer()
        }
    }
}

#Preview {
    NavigationStack {
        EventDetailView(event: Event(
            eventType: .packageTaken,
            timestamp: Date(),
            confidence: 0.94,
            metadata: ["carrier": .string("Amazon"), "duration_s": .number(7)]
        ))
    }
    .environmentObject(AppState())
}
