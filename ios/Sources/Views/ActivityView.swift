import SwiftUI

struct ActivityView: View {
    @EnvironmentObject private var appState: AppState
    @State private var filter: Filter = .all

    enum Filter: String, CaseIterable, Identifiable {
        case all = "All", packages = "Packages", people = "People", animals = "Animals"
        var id: String { rawValue }
        var category: EventType.Category? {
            switch self {
            case .all: return nil
            case .packages: return .packages
            case .people:   return .people
            case .animals:  return .animals
            }
        }
    }

    private var filteredEvents: [Event] {
        guard let cat = filter.category else { return appState.events }
        return appState.events.filter { $0.eventType.category == cat }
    }

    private struct Bucket: Identifiable {
        let id: String
        let title: String
        let events: [Event]
    }
    private var buckets: [Bucket] {
        let cal = Calendar.current
        let grouped = Dictionary(grouping: filteredEvents) { ev -> String in
            if cal.isDateInToday(ev.timestamp)     { return "Today" }
            if cal.isDateInYesterday(ev.timestamp) { return "Yesterday" }
            let f = DateFormatter(); f.dateStyle = .medium
            return f.string(from: ev.timestamp)
        }
        let order = ["Today", "Yesterday"]
        return grouped
            .map { Bucket(id: $0.key, title: $0.key,
                          events: $0.value.sorted { $0.timestamp > $1.timestamp }) }
            .sorted { a, b in
                let ai = order.firstIndex(of: a.title) ?? Int.max
                let bi = order.firstIndex(of: b.title) ?? Int.max
                if ai != bi { return ai < bi }
                return (a.events.first?.timestamp ?? .distantPast)
                     > (b.events.first?.timestamp ?? .distantPast)
            }
    }

    var body: some View {
        NavigationStack {
            PeepScreen {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        header
                        filterChips
                        if filteredEvents.isEmpty {
                            emptyState
                        } else {
                            ForEach(buckets) { b in
                                bucketView(b)
                            }
                        }
                        Spacer(minLength: 110)
                    }
                    .padding(.top, 6)
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(for: Event.self) { ev in
                EventDetailView(event: ev)
            }
        }
    }

    private var header: some View {
        Text("Activity")
            .font(.system(size: 28, weight: .semibold))
            .tracking(-0.4)
            .foregroundStyle(Color.peepText)
            .padding(.horizontal, 16)
            .padding(.top, 4)
    }

    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                ForEach(Filter.allCases) { f in
                    PeepPill(title: f.rawValue, selected: f == filter, compact: true) {
                        filter = f
                    }
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private func bucketView(_ b: Bucket) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(b.title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(Color.peepTextSec)
                Spacer()
                Text("\(b.events.count)")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Color.peepTextTer)
            }
            .padding(.horizontal, 20)
            VStack(spacing: 8) {
                ForEach(b.events) { ev in
                    NavigationLink(value: ev) {
                        EventRowView(event: ev)
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(.horizontal, 16)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: "checkmark")
                .font(.system(size: 36, weight: .light))
                .foregroundStyle(Color.peepTextTer)
            Text("No \(filter.rawValue.lowercased()) events in the last 48 hours")
                .font(.system(size: 14))
                .foregroundStyle(Color.peepTextSec)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 60)
        .padding(.horizontal, 40)
    }
}

// MARK: - Row

struct EventRowView: View {
    let event: Event

    var body: some View {
        PeepSurface(padding: 14) {
            HStack(alignment: .top, spacing: 12) {
                Text(event.eventType.emoji).font(.system(size: 22))
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.eventType.label)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(Color.peepText)
                    HStack(spacing: 6) {
                        Text(time(event.timestamp))
                            .font(.system(size: 12, design: .monospaced))
                        Text("·")
                        Text(String(format: "%.0f%%", event.confidence * 100))
                            .font(.system(size: 12, design: .monospaced))
                    }
                    .foregroundStyle(Color.peepTextSec)
                }
                Spacer(minLength: 8)
                PeepSeverityBadge(severity: event.severity)
            }
        }
    }

    private func time(_ d: Date) -> String {
        let f = DateFormatter(); f.dateFormat = "HH:mm"; return f.string(from: d)
    }
}

#Preview {
    ActivityView()
        .environmentObject(AppState())
        .preferredColorScheme(.light)
}
