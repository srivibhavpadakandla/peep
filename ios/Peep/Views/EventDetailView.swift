import SwiftUI

struct EventDetailView: View {
    let event: Event

    private static let timestampFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateStyle = .medium
        f.timeStyle = .short
        return f
    }()

    private var receiptID: String {
        // Deterministic-ish pseudo receipt from the event id.
        let raw = event.id.uuidString
            .replacingOccurrences(of: "-", with: "")
            .prefix(8)
            .uppercased()
        return "RFND-\(raw.prefix(5))-\(raw.suffix(3))"
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                clipPlaceholder

                VStack(alignment: .leading, spacing: 12) {
                    Text(event.eventType.label)
                        .font(.largeTitle.weight(.semibold))
                        .fixedSize(horizontal: false, vertical: true)

                    HStack(spacing: 10) {
                        SeverityBadge(severity: event.severity)
                        Text(Self.timestampFormatter.string(from: event.timestamp))
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Confidence")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                            Spacer()
                            Text(String(format: "%.2f", event.confidence))
                                .font(.system(.caption, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        ProgressView(value: event.confidence)
                            .tint(.peepAccent)
                    }
                    .padding(.top, 4)
                }
                .padding(.horizontal, 20)

                whatPeepDid
                    .padding(.horizontal, 20)

                if let meta = event.metadata, !meta.isEmpty {
                    metadataCard(meta: meta)
                        .padding(.horizontal, 20)
                }

                actions
                    .padding(.horizontal, 20)
                    .padding(.bottom, 24)
            }
            .padding(.top, 8)
        }
        .background(Color(.systemBackground))
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - Clip placeholder

    private var clipPlaceholder: some View {
        ZStack {
            Rectangle().fill(Color.black)
                .aspectRatio(16/9, contentMode: .fit)
            Circle()
                .fill(.ultraThinMaterial)
                .frame(width: 64, height: 64)
                .overlay(
                    Image(systemName: "play.fill")
                        .font(.system(size: 24, weight: .semibold))
                        .foregroundStyle(.white)
                        .offset(x: 2)
                )
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    Text(event.clipURL.absoluteString)
                        .font(.system(.caption2, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.7))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(.black.opacity(0.4), in: Capsule())
                        .padding(10)
                }
            }
        }
    }

    // MARK: - What Peep did

    private var whatPeepDid: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("What Peep did")
                .font(.headline)

            VStack(alignment: .leading, spacing: 0) {
                TimelineStep(
                    title: "Vision agent",
                    subtitle: "detected \(event.eventType.rawValue) (conf \(String(format: "%.2f", event.confidence)))",
                    isLast: false
                )
                TimelineStep(
                    title: "Orchestration",
                    subtitle: decisionLine,
                    isLast: false
                )
                TimelineStep(
                    title: "Browser agent",
                    subtitle: browserLine,
                    isLast: true
                )
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }

    private var decisionLine: String {
        switch event.eventType {
        case .packageTaken:       return "decided to file refund"
        case .packageNotArrived:  return "decided to file missing claim"
        case .weaponDetected:     return "escalated · awaiting human review"
        default:                  return "logged alert"
        }
    }

    private var browserLine: String {
        switch event.eventType {
        case .packageTaken:       return "receipt \(receiptID)"
        case .packageNotArrived:  return "claim \(receiptID)"
        default:                  return "no action taken"
        }
    }

    // MARK: - Metadata

    private func metadataCard(meta: [String: CodableMeta]) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Metadata")
                .font(.headline)
            ForEach(meta.keys.sorted(), id: \.self) { key in
                HStack {
                    Text(key)
                        .font(.system(.subheadline, design: .monospaced))
                        .foregroundStyle(.secondary)
                    Spacer()
                    Text(meta[key]?.displayValue ?? "—")
                        .font(.system(.subheadline, design: .monospaced))
                        .foregroundStyle(.primary)
                }
            }
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }

    // MARK: - Actions

    private var actions: some View {
        VStack(spacing: 10) {
            actionRow(title: "Mark resolved", icon: "checkmark.circle.fill", role: .none)
            actionRow(title: "Report wrong",  icon: "exclamationmark.bubble.fill", role: .none)
            actionRow(title: "Share clip",    icon: "square.and.arrow.up", role: .none)
            if event.severity == .critical {
                actionRow(title: "Call police", icon: "phone.fill", role: .destructive)
            }
        }
    }

    private func actionRow(title: String, icon: String, role: ButtonRole?) -> some View {
        Button(role: role) {
            // hook up later
        } label: {
            HStack {
                Image(systemName: icon)
                    .font(.body.weight(.semibold))
                Text(title)
                    .font(.body.weight(.semibold))
                Spacer()
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .fill(role == .destructive
                          ? Color.red.opacity(0.15)
                          : Color(.secondarySystemBackground))
            )
            .foregroundStyle(role == .destructive ? Color.red : Color.primary)
        }
        .buttonStyle(.plain)
    }
}

// MARK: - TimelineStep

private struct TimelineStep: View {
    let title: String
    let subtitle: String
    let isLast: Bool

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(spacing: 0) {
                Circle()
                    .fill(Color.peepAccent)
                    .frame(width: 10, height: 10)
                    .overlay(Circle().stroke(Color.peepAccent.opacity(0.35), lineWidth: 4).scaleEffect(1.4))
                if !isLast {
                    Rectangle()
                        .fill(Color.secondary.opacity(0.35))
                        .frame(width: 1.5)
                        .frame(maxHeight: .infinity)
                }
            }
            .frame(width: 14)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.semibold))
                Text(subtitle)
                    .font(.system(.subheadline, design: .monospaced))
                    .foregroundStyle(.secondary)
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
            metadata: ["carrier": .string("Amazon"),
                       "duration_s": .number(7)]
        ))
    }
    .environmentObject(AppState())
    .preferredColorScheme(.dark)
}
