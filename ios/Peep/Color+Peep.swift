import SwiftUI

/// Peep design palette — sage + slate + plum on warm cream.
///
/// Light theme by default. Severity colors are text-only (no colored pills or
/// chip backgrounds) and live deliberately close together in lightness so the
/// product reads as calm. The sage `accent` is the *only* color reserved for
/// actions — links, primary CTAs, the "watching" status dot.
extension Color {
    // ───── Brand / surfaces ─────────────────────────────────────────────
    /// Warm cream — page background.
    static let peepBg = Color(red: 0.961, green: 0.953, blue: 0.925)        // #f5f3ec
    /// Pure white — card surface.
    static let peepSurface = Color.white                                     // #ffffff
    /// Soft cream — secondary chips, time pills.
    static let peepSurface2 = Color(red: 0.929, green: 0.922, blue: 0.886)  // #edebe2
    /// Slightly darker — sliders/track bg, divider strips.
    static let peepSurface3 = Color(red: 0.875, green: 0.863, blue: 0.823)  // #dfdcd2

    // ───── Text ────────────────────────────────────────────────────────
    /// Deep plum-charcoal — primary text.
    static let peepText = Color(red: 0.239, green: 0.208, blue: 0.282)       // #3d3548
    /// Slate green-gray — secondary text, captions.
    static let peepTextSec = Color(red: 0.443, green: 0.502, blue: 0.490)    // #71807d
    /// Soft sage — tertiary, disabled labels.
    static let peepTextTer = Color(red: 0.659, green: 0.659, blue: 0.620)    // #a8a89e

    /// Separator — 10% of primary text on cream.
    static let peepSep = Color(red: 0.239, green: 0.208, blue: 0.282).opacity(0.10)

    // ───── Accent — the ONE bright color, used sparingly ──────────────
    /// Sage green — primary actions, links, the watching dot.
    static let peepAccent = Color(red: 0.416, green: 0.600, blue: 0.443)     // #6a9971
    /// 12% sage — soft pill backgrounds for active/connected states.
    static let peepAccentSoft = Color(red: 0.416, green: 0.600, blue: 0.443).opacity(0.12)

    // ───── Severity (text-only — never use as a fill) ─────────────────
    /// Deep plum — critical severity.
    static let severityCritical = Color(red: 0.341, green: 0.294, blue: 0.416) // #574b6a
    /// Muted purple — high severity.
    static let severityHigh = Color(red: 0.431, green: 0.376, blue: 0.510)     // #6e6082
    /// Olive — warning severity.
    static let severityWarning = Color(red: 0.682, green: 0.733, blue: 0.490)  // #aebb7d
    /// Slate — info severity (same as textSec, intentionally).
    static let severityInfo = Color(red: 0.443, green: 0.502, blue: 0.490)     // #71807d
}
