import SwiftUI

// Palette mirrors the Peep iOS Interactive design tokens
// (warm cream surfaces, plum text, sage accent).
extension Color {
    // Brand
    static let peepAccent     = Color(red: 0x6a/255, green: 0x99/255, blue: 0x71/255) // #6a9971 sage

    // Surfaces
    static let peepBg         = Color(red: 0xf5/255, green: 0xf3/255, blue: 0xec/255) // #f5f3ec cream
    static let peepSurface    = Color.white
    static let peepSurface2   = Color(red: 0xed/255, green: 0xeb/255, blue: 0xe2/255) // #edebe2
    static let peepSurface3   = Color(red: 0xdf/255, green: 0xdc/255, blue: 0xd2/255) // #dfdcd2

    // Text
    static let peepText       = Color(red: 0x3d/255, green: 0x35/255, blue: 0x48/255) // #3d3548 plum-charcoal
    static let peepTextSec    = Color(red: 0x71/255, green: 0x80/255, blue: 0x7d/255) // #71807d slate
    static let peepTextTer    = Color(red: 0xa8/255, green: 0xa8/255, blue: 0x9e/255) // #a8a89e

    // Hairlines
    static let peepSep        = Color(red: 0x3d/255, green: 0x35/255, blue: 0x48/255).opacity(0.10)

    // Severity
    static let severityCritical = Color(red: 0x57/255, green: 0x4b/255, blue: 0x6a/255) // #574b6a plum
    static let severityHigh     = Color(red: 0x6e/255, green: 0x60/255, blue: 0x82/255) // #6e6082 muted purple
    static let severityWarning  = Color(red: 0xae/255, green: 0xbb/255, blue: 0x7d/255) // #aebb7d olive
    static let severityInfo     = Color(red: 0x71/255, green: 0x80/255, blue: 0x7d/255) // #71807d slate
}
