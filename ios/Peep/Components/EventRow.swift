import SwiftUI

/// Minimal event row, per the redesign: title + time/confidence + text-only
/// severity. No icon tile, no chevron, no row dots. The whole row is the tap
/// target; the parent NavigationLink does the visual indication.
struct EventRow: View {
    let event: Event

    private static let timeFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "h:mm a"
        return f
    }()

    var body: some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(event.eventType.label)
                    .font(.system(size: 15))
                    .foregroundStyle(Color.peepText)
                    .lineLimit(1)
                HStack(spacing: 8) {
                    Text(Self.timeFormatter.string(from: event.timestamp))
                        .font(.system(size: 13))
                        .foregroundStyle(Color.peepTextSec)
                    Text("·")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.peepTextTer)
                    Text("\(Int((event.confidence * 100).rounded()))% confidence")
                        .font(.system(size: 13))
                        .foregroundStyle(Color.peepTextSec)
                }
            }
            Spacer(minLength: 8)
            SeverityBadge(severity: event.severity)
        }
        .padding(.vertical, 12)
        .contentShape(Rectangle())
    }
}

#Preview {
    VStack(spacing: 0) {
        EventRow(event: Event(eventType: .packageTaken, timestamp: Date(), confidence: 0.94))
        Divider().background(Color.peepSep)
        EventRow(event: Event(eventType: .animalDetected, timestamp: Date(), confidence: 0.78))
    }
    .padding(.horizontal, 20)
    .background(Color.peepBg)
}
