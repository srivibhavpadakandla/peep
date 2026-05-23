import SwiftUI

struct ActivityView: View {
    @EnvironmentObject private var appState: AppState

    private struct Group: Identifiable {
        let id: String
        let title: String
        let events: [Event]
    }

    private var groups: [Group] {
        let cal = Calendar.current
        let buckets = Dictionary(grouping: appState.events) { event -> String in
            if cal.isDateInToday(event.timestamp)     { return "Today" }
            if cal.isDateInYesterday(event.timestamp) { return "Yesterday" }
            let f = DateFormatter()
            f.dateStyle = .medium
            return f.string(from: event.timestamp)
        }
        let order = ["Today", "Yesterday"]
        return buckets
            .map { Group(id: $0.key, title: $0.key, events: $0.value.sorted { $0.timestamp > $1.timestamp }) }
            .sorted { a, b in
                let ai = order.firstIndex(of: a.title) ?? Int.max
                let bi = order.firstIndex(of: b.title) ?? Int.max
                if ai != bi { return ai < bi }
                return (a.events.first?.timestamp ?? .distantPast) >
                       (b.events.first?.timestamp ?? .distantPast)
            }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 24, pinnedViews: []) {
                    ForEach(groups) { group in
                        Section {
                            LazyVStack(spacing: 10) {
                                ForEach(group.events) { event in
                                    NavigationLink(value: event) {
                                        EventRow(event: event)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        } header: {
                            HStack {
                                Text(group.title)
                                    .font(.headline)
                                    .foregroundStyle(.primary)
                                Spacer()
                                Text("\(group.events.count)")
                                    .font(.system(.caption, design: .monospaced))
                                    .foregroundStyle(.secondary)
                            }
                            .padding(.horizontal, 4)
                        }
                    }
                }
                .padding(.horizontal, 20)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .navigationTitle("Activity")
            .navigationBarTitleDisplayMode(.large)
            .navigationDestination(for: Event.self) { event in
                EventDetailView(event: event)
            }
            .background(Color(.systemBackground))
        }
    }
}

#Preview {
    ActivityView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
