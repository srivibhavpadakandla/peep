import Foundation
import Combine
import SwiftUI

// Talks to the local browser-agent service (agentic-server/server.js).
//
// On critical events (e.g. package_taken) the iOS app POSTs to /run with
// the chosen workflow + the event, then surfaces the returned receipt on
// the Live tab's active-event card and inside Event detail.
//
// Base URL is overridable via UserDefaults("peep.agentURL") so a physical
// device can hit the Mac's LAN address (e.g. http://192.168.1.42:8787).

struct AgenticReceipt: Codable, Hashable {
    let id: String
    let order_id: String
    let reason: String
    let notes: String?
    let issued_at: String?
    let status: String?
}

struct AgenticRunResult: Codable {
    let ok: Bool
    let receipt: AgenticReceipt?
    let error: String?
    let skipped: Bool?
}

enum DispatchStatus: Equatable {
    case queued
    case dispatched         // request sent
    case done(AgenticReceipt)
    case failed(String)
    case skipped(String)

    var label: String {
        switch self {
        case .queued:        return "Queued"
        case .dispatched:    return "Filing…"
        case .done:          return "Filed"
        case .failed:        return "Failed"
        case .skipped:       return "No action"
        }
    }
}

@MainActor
final class AgenticClient: ObservableObject {
    static let shared = AgenticClient()

    /// Most-recent dispatch per event id. Subscribers re-render when this changes.
    @Published var dispatches: [UUID: DispatchStatus] = [:]

    /// Mirrors agentic/orchestration-agent.jsx routing table.
    private func workflow(for event: Event) -> String? {
        switch event.eventType {
        case .packageTaken:      return "file_amazon_refund"
        case .packageNotArrived: return "file_missing_delivery"
        default:                 return nil   // log-only
        }
    }

    var baseURL: URL {
        let stored = UserDefaults.standard.string(forKey: "peep.agentURL")
        return URL(string: stored ?? "http://localhost:8787")!
    }

    func dispatch(_ event: Event) {
        guard let wf = workflow(for: event) else {
            dispatches[event.id] = .skipped("Log-only event")
            return
        }
        dispatches[event.id] = .dispatched

        let payload: [String: Any] = [
            "workflow": wf,
            "event": [
                "event_type":    event.eventType.rawValue,
                "timestamp":     Int(event.timestamp.timeIntervalSince1970 * 1000),
                "confidence":    event.confidence,
                "evidence_clip": [
                    "kind": "frame",
                    "ref":  "peep://clips/\(event.id.uuidString).jpg",
                ] as [String: String],
            ] as [String: Any],
        ]
        guard let body = try? JSONSerialization.data(withJSONObject: payload) else { return }

        var req = URLRequest(url: baseURL.appendingPathComponent("run"))
        req.httpMethod = "POST"
        req.timeoutInterval = 30
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = body

        Task {
            do {
                let (data, resp) = try await URLSession.shared.data(for: req)
                guard let http = resp as? HTTPURLResponse else {
                    await MainActor.run { self.dispatches[event.id] = .failed("no response") }
                    return
                }
                let result = try JSONDecoder().decode(AgenticRunResult.self, from: data)
                await MainActor.run {
                    if let r = result.receipt, result.ok {
                        self.dispatches[event.id] = .done(r)
                    } else if let err = result.error {
                        self.dispatches[event.id] = .failed("HTTP \(http.statusCode): \(err)")
                    } else if result.skipped == true {
                        self.dispatches[event.id] = .skipped("server skipped")
                    } else {
                        self.dispatches[event.id] = .failed("HTTP \(http.statusCode)")
                    }
                }
            } catch {
                await MainActor.run {
                    self.dispatches[event.id] = .failed(error.localizedDescription)
                }
            }
        }
    }
}
