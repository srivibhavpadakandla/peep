import SwiftUI

struct SeverityBadge: View {
    let severity: Severity

    var body: some View {
        HStack(spacing: 6) {
            Circle()
                .fill(severity.color)
                .frame(width: 6, height: 6)
            Text(severity.label.uppercased())
                .font(.system(.caption2, design: .default).weight(.semibold))
                .tracking(0.6)
                .foregroundStyle(severity.color)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(severity.color.opacity(0.12), in: Capsule())
        .overlay(
            Capsule().stroke(severity.color.opacity(0.35), lineWidth: 0.5)
        )
    }
}

#Preview {
    VStack(spacing: 12) {
        SeverityBadge(severity: .info)
        SeverityBadge(severity: .warning)
        SeverityBadge(severity: .high)
        SeverityBadge(severity: .critical)
    }
    .padding()
    .preferredColorScheme(.dark)
}
