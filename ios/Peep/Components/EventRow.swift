import SwiftUI

struct EventRow: View {
    let event: Event

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f
    }()

    var body: some View {
        HStack(spacing: 14) {
            // Emoji icon tile — playful, only inside feed rows.
            ZStack {
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(event.severity.color.opacity(0.14))
                Text(event.eventType.emoji)
                    .font(.system(size: 22))
            }
            .frame(width: 44, height: 44)
            .overlay(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .stroke(event.severity.color.opacity(0.25), lineWidth: 0.5)
            )

            VStack(alignment: .leading, spacing: 4) {
                Text(event.eventType.label)
                    .font(.body.weight(.medium))
                    .foregroundStyle(.primary)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    Text(Self.timeFormatter.string(from: event.timestamp))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text("·")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(String(format: "conf %.2f", event.confidence))
                        .font(.system(.caption, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
            }

            Spacer(minLength: 8)

            VStack(alignment: .trailing, spacing: 6) {
                SeverityBadge(severity: event.severity)
                Image(systemName: "chevron.right")
                    .font(.caption.weight(.semibold))
                    .foregroundStyle(.tertiary)
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
        .contentShape(Rectangle())
    }
}

#Preview {
    VStack(spacing: 10) {
        EventRow(event: Event(eventType: .packageTaken,
                              timestamp: Date(),
                              confidence: 0.94))
        EventRow(event: Event(eventType: .animalDetected,
                              timestamp: Date(),
                              confidence: 0.78))
    }
    .padding()
    .preferredColorScheme(.dark)
}
