import SwiftUI

extension Color {
    /// Brand accent — calm emerald green.
    static let peepAccent = Color(red: 0.06, green: 0.72, blue: 0.51)

    // Severity palette
    static let severityCritical = Color.red
    static let severityHigh     = Color.orange
    static let severityWarning  = Color(red: 1.0, green: 0.75, blue: 0.20) // amber
    static let severityInfo     = Color(red: 0.35, green: 0.78, blue: 0.98) // sky
}
