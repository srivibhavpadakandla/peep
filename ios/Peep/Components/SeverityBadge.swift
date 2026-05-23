import SwiftUI

/// Text-only severity label, per the redesign — no colored pills, no dots.
/// The whole point is calm UI; severity reads as a quiet caption next to the
/// event title rather than shouting from a chip.
struct SeverityBadge: View {
    let severity: Severity

    var body: some View {
        Text(severity.label)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(severity.color)
    }
}

#Preview {
    VStack(alignment: .leading, spacing: 12) {
        SeverityBadge(severity: .critical)
        SeverityBadge(severity: .high)
        SeverityBadge(severity: .warning)
        SeverityBadge(severity: .info)
    }
    .padding()
    .background(Color.peepBg)
}
