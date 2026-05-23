import Foundation
import Combine

@MainActor
final class AppState: ObservableObject {
    @Published var events: [Event] = []
    @Published var deliveries: [ExpectedDelivery] = []
    @Published var activeEvent: Event?
    @Published var alertsMutedUntil: Date?

    init() { seedDemoData() }

    /// Seed events + deliveries that mirror the interactive HTML prototype
    /// (TODAY_EVENTS, YEST_EVENTS, initialState.deliveries). Real events from
    /// the camera still flow in via `ingest()`.
    private func seedDemoData() {
        let cal = Calendar.current
        let now = Date()
        func today(_ h: Int, _ m: Int) -> Date {
            cal.date(bySettingHour: h, minute: m, second: 0, of: now) ?? now
        }
        func yesterday(_ h: Int, _ m: Int) -> Date {
            let y = cal.date(byAdding: .day, value: -1, to: now) ?? now
            return cal.date(bySettingHour: h, minute: m, second: 0, of: y) ?? y
        }

        let todayEvents: [Event] = [
            Event(eventType: .packageTaken,    timestamp: today(14, 32), confidence: 0.94,
                  metadata: ["carrier": .string("Amazon"), "duration_s": .number(7)]),
            Event(eventType: .packageArrived,  timestamp: today(13, 58), confidence: 0.97,
                  metadata: ["carrier": .string("Amazon")]),
            Event(eventType: .personLoitering, timestamp: today(12, 11), confidence: 0.81,
                  metadata: ["duration_s": .number(8)]),
            Event(eventType: .animalDetected,  timestamp: today(10,  4), confidence: 0.88,
                  metadata: ["species": .string("dog")]),
            Event(eventType: .packageArrived,  timestamp: today( 9, 21), confidence: 0.96,
                  metadata: ["carrier": .string("UPS")]),
        ]
        let yesterdayEvents: [Event] = [
            Event(eventType: .afterHoursActivity, timestamp: yesterday(23, 58), confidence: 0.73),
            Event(eventType: .multipleLoitering,  timestamp: yesterday(22, 47), confidence: 0.79,
                  metadata: ["count": .number(3)]),
            Event(eventType: .weaponDetected,     timestamp: yesterday(21, 12), confidence: 0.62,
                  metadata: ["object": .string("unknown_metal")]),
            Event(eventType: .packageNotArrived,  timestamp: yesterday(19, 30), confidence: 0.99,
                  metadata: ["order_id": .string("114-2238871-9920443")]),
            Event(eventType: .packageArrived,     timestamp: yesterday(15,  5), confidence: 0.95,
                  metadata: ["carrier": .string("FedEx")]),
            Event(eventType: .animalDetected,     timestamp: yesterday( 6, 42), confidence: 0.91,
                  metadata: ["species": .string("bear")]),
        ]

        events = (todayEvents + yesterdayEvents).sorted { $0.timestamp > $1.timestamp }
        activeEvent = events.first { $0.eventType == .packageTaken }

        deliveries = [
            ExpectedDelivery(orderID: "114-8829112-0034221",
                             item: "Anker PowerCore 20K Portable Charger",
                             carrier: "Amazon"),
            ExpectedDelivery(orderID: "112-4490023-1188776",
                             item: "Logitech MX Master 3S",
                             carrier: "UPS"),
        ]
    }

    // MARK: - Ingestion (real events from the device camera)

    /// Append a real event coming from the vision pipeline.
    /// Critical / high events become the activeEvent surfaced on the Live tab.
    func ingest(_ event: Event) {
        events.insert(event, at: 0)
        if events.count > 200 { events.removeLast(events.count - 200) }
        if event.severity == .critical || event.severity == .high {
            activeEvent = event
        }
        // Hand off to the agentic action layer.
        AgenticClient.shared.dispatch(event)
    }

    // MARK: - Mutations

    func addDelivery(orderID: String, item: String, carrier: String = "Amazon") {
        deliveries.append(ExpectedDelivery(orderID: orderID, item: item, carrier: carrier))
    }

    func toggleDelivery(_ delivery: ExpectedDelivery) {
        guard let idx = deliveries.firstIndex(where: { $0.id == delivery.id }) else { return }
        deliveries[idx].received.toggle()
    }

    func muteAlerts(for interval: TimeInterval) {
        alertsMutedUntil = Date().addingTimeInterval(interval)
    }

    func clearActiveEvent() {
        activeEvent = nil
    }

    // MARK: - Derived

    var pendingDeliveries: [ExpectedDelivery] {
        deliveries.filter { !$0.received }
    }

    var alertsMuted: Bool {
        guard let until = alertsMutedUntil else { return false }
        return until > Date()
    }
}
