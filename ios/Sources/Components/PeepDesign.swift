import SwiftUI

// Shared design primitives that mirror the interactive HTML prototype.
// Use these instead of native Form/List/Toggle/Section so the iOS app
// renders with the cream/sage palette and the prototype's chrome.

// MARK: - Surface (white card with hairline border)

struct PeepSurface<Content: View>: View {
    var padding: CGFloat = 16
    var cornerRadius: CGFloat = 12
    let content: () -> Content

    init(padding: CGFloat = 16, cornerRadius: CGFloat = 12,
         @ViewBuilder content: @escaping () -> Content) {
        self.padding = padding
        self.cornerRadius = cornerRadius
        self.content = content
    }

    var body: some View {
        content()
            .padding(padding)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .fill(Color.peepSurface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
                    .stroke(Color.peepSep, lineWidth: 0.5)
            )
    }
}

// MARK: - Hairline separator

struct PeepHairline: View {
    var inset: CGFloat = 16
    var body: some View {
        Rectangle()
            .fill(Color.peepSep)
            .frame(height: 0.5)
            .padding(.leading, inset)
    }
}

// MARK: - Section title (small caps, secondary color)

struct PeepSectionTitle: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 11, weight: .semibold))
            .tracking(0.6)
            .foregroundStyle(Color.peepTextSec)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.horizontal, 20)
            .padding(.bottom, 8)
    }
}

// MARK: - Pill chip (segmented control style)

struct PeepPill: View {
    let title: String
    var selected: Bool = false
    var compact: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 13, weight: selected ? .semibold : .regular))
                .foregroundStyle(selected ? Color.peepBg : Color.peepText)
                .padding(.horizontal, compact ? 11 : 13)
                .padding(.vertical, compact ? 5 : 6)
                .background(
                    Capsule().fill(selected ? Color.peepText : Color.peepSurface)
                )
                .overlay(
                    Capsule().stroke(Color.peepSep, lineWidth: selected ? 0 : 0.5)
                )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Custom toggle (dark plum thumb-track)

struct PeepToggle: View {
    @Binding var isOn: Bool

    var body: some View {
        Button(action: { withAnimation(.easeInOut(duration: 0.18)) { isOn.toggle() } }) {
            ZStack(alignment: isOn ? .trailing : .leading) {
                Capsule()
                    .fill(isOn ? Color.peepText : Color.peepSurface3)
                    .frame(width: 44, height: 26)
                Circle()
                    .fill(Color.peepBg)
                    .frame(width: 22, height: 22)
                    .padding(2)
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Filled action button (peep.text bg, peep.bg text)

struct PeepPrimaryButton: View {
    let title: String
    var icon: String? = nil
    var fillWidth: Bool = true
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon = icon { Image(systemName: icon) }
                Text(title).font(.system(size: 14, weight: .semibold))
                if fillWidth { Spacer() }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .foregroundStyle(Color.peepBg)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Color.peepText)
            )
        }
        .buttonStyle(.plain)
        .frame(maxWidth: fillWidth ? .infinity : nil)
    }
}

// MARK: - Tertiary button (surface bg + hairline)

struct PeepGhostButton: View {
    let title: String
    var icon: String? = nil
    var destructive: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                if let icon = icon { Image(systemName: icon) }
                Text(title).font(.system(size: 14, weight: .medium))
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .foregroundStyle(destructive ? Color.severityCritical : Color.peepText)
            .frame(maxWidth: .infinity)
            .background(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .fill(Color.peepSurface)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 10, style: .continuous)
                    .stroke(destructive ? Color.severityCritical.opacity(0.5) : Color.peepSep, lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - Severity badge

struct PeepSeverityBadge: View {
    let severity: Severity

    var body: some View {
        Text(label)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(severity.color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(
                Capsule().fill(severity.color.opacity(0.14))
            )
            .overlay(
                Capsule().stroke(severity.color.opacity(0.30), lineWidth: 0.5)
            )
    }

    private var label: String {
        switch severity {
        case .critical: return "Critical"
        case .high:     return "High"
        case .warning:  return "Warning"
        case .info:     return "Info"
        }
    }
}

// MARK: - Icon container (square rounded with tinted background)

struct PeepIconBadge: View {
    let systemName: String
    let tint: Color

    var body: some View {
        RoundedRectangle(cornerRadius: 9, style: .continuous)
            .fill(tint.opacity(0.14))
            .overlay(
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .stroke(tint.opacity(0.30), lineWidth: 0.5)
            )
            .overlay(
                Image(systemName: systemName)
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundStyle(tint)
            )
            .frame(width: 36, height: 36)
    }
}

// MARK: - Screen background

struct PeepScreen<Content: View>: View {
    let content: () -> Content
    init(@ViewBuilder content: @escaping () -> Content) { self.content = content }
    var body: some View {
        ZStack { Color.peepBg.ignoresSafeArea(); content() }
    }
}

// MARK: - Mono text helper

extension Text {
    func peepMono(_ size: CGFloat = 12) -> Text {
        self.font(.system(size: size, weight: .regular, design: .monospaced))
    }
}
