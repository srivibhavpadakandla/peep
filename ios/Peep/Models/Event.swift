import Foundation
import SwiftUI

// MARK: - Severity

enum Severity: String, Codable, Hashable {
    case info, warning, high, critical

    var label: String {
        switch self {
        case .info:     return "Info"
        case .warning:  return "Warning"
        case .high:     return "High"
        case .critical: return "Critical"
        }
    }

    var color: Color {
        switch self {
        case .info:     return .severityInfo
        case .warning:  return .severityWarning
        case .high:     return .severityHigh
        case .critical: return .severityCritical
        }
    }
}

// MARK: - EventType

enum EventType: String, Codable, Hashable, CaseIterable {
    case packageArrived       = "package_arrived"
    case packageTaken         = "package_taken"
    case packageNotArrived    = "package_not_arrived"
    case personLoitering      = "person_loitering"
    case multipleLoitering    = "multiple_loitering"
    case weaponDetected       = "weapon_detected"
    case afterHoursActivity   = "after_hours_activity"
    case animalDetected       = "animal_detected"

    var label: String {
        switch self {
        case .packageArrived:     return "Package arrived"
        case .packageTaken:       return "Package taken"
        case .packageNotArrived:  return "Package never arrived"
        case .personLoitering:    return "Person loitering"
        case .multipleLoitering:  return "Multiple people loitering"
        case .weaponDetected:     return "Weapon detected"
        case .afterHoursActivity: return "After-hours activity"
        case .animalDetected:     return "Animal detected"
        }
    }

    /// Playful emoji shown only inside feed rows.
    var emoji: String {
        switch self {
        case .packageArrived, .packageNotArrived: return "📦"
        case .packageTaken:        return "📦"
        case .personLoitering:     return "🚶"
        case .multipleLoitering:   return "👥"
        case .weaponDetected:      return "⚠️"
        case .afterHoursActivity:  return "🌙"
        case .animalDetected:      return "🐕"
        }
    }

    var defaultSeverity: Severity {
        switch self {
        case .packageArrived:      return .info
        case .packageTaken:        return .critical
        case .packageNotArrived:   return .high
        case .personLoitering:     return .warning
        case .multipleLoitering:   return .high
        case .weaponDetected:      return .critical
        case .afterHoursActivity:  return .warning
        case .animalDetected:      return .info
        }
    }

    var autoAction: String? {
        switch self {
        case .packageTaken:       return "Filed Amazon refund (reason=package_stolen)"
        case .packageNotArrived:  return "Filed Amazon claim (reason=never_arrived)"
        case .personLoitering,
             .multipleLoitering,
             .weaponDetected,
             .afterHoursActivity,
             .animalDetected:     return "Logged alert"
        case .packageArrived:     return nil
        }
    }
}

// MARK: - CodableMeta

/// Tiny JSON-ish dictionary value, used for Event.metadata.
enum CodableMeta: Codable, Hashable {
    case string(String)
    case number(Double)
    case bool(Bool)

    var displayValue: String {
        switch self {
        case .string(let s): return s
        case .number(let n):
            if n.rounded() == n { return String(Int(n)) }
            return String(format: "%.2f", n)
        case .bool(let b):   return b ? "true" : "false"
        }
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let s = try? c.decode(String.self) { self = .string(s); return }
        if let n = try? c.decode(Double.self) { self = .number(n); return }
        if let b = try? c.decode(Bool.self)   { self = .bool(b);   return }
        throw DecodingError.typeMismatch(
            CodableMeta.self,
            .init(codingPath: decoder.codingPath, debugDescription: "Unsupported meta value")
        )
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .number(let n): try c.encode(n)
        case .bool(let b):   try c.encode(b)
        }
    }
}

// MARK: - Event

struct Event: Identifiable, Hashable, Codable {
    let id: UUID
    let eventType: EventType
    let timestamp: Date
    let confidence: Double
    let clipURL: URL
    let metadata: [String: CodableMeta]?

    var severity: Severity { eventType.defaultSeverity }

    init(
        id: UUID = UUID(),
        eventType: EventType,
        timestamp: Date,
        confidence: Double,
        clipURL: URL = URL(string: "peep://clips/sample.mp4")!,
        metadata: [String: CodableMeta]? = nil
    ) {
        self.id = id
        self.eventType = eventType
        self.timestamp = timestamp
        self.confidence = confidence
        self.clipURL = clipURL
        self.metadata = metadata
    }
}
