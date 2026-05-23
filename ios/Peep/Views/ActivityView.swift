import SwiftUI

/// Activity — the event log, calmly. Day-grouped (Today, Yesterday), rows are
/// hairline-separated, no card backgrounds, no icons or chevrons.
struct ActivityView: View {
    @EnvironmentObject private var appState: AppState

    private struct EventGroup: Identifiable {
        let id: String
        let title: String
        let events: [Event]
    }

    private var groups: [EventGroup] {
        let cal = Calendar.current
        let buckets = Dictionary(grouping: appState.events) { event -> String in
            if cal.isDateInToday(event.timestamp) { return "Today" }
            if cal.isDateInYesterday(event.timestamp) { return "Yesterday" }
            let f = DateFormatter()
            f.dateStyle = .medium
            return f.string(from: event.timestamp)
        }
        let order = ["Today", "Yesterday"]
        return buckets
            .map { EventGroup(id: $0.key, title: $0.key,
                              events: $0.value.sorted { $0.timestamp > $1.timestamp }) }
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
            ZStack {
                Color.peepBg.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 28) {
                        Text("Activity")
                            .font(.system(size: 28, weight: .medium))
                            .foregroundStyle(Color.peepText)
                            .padding(.horizontal, 20)
                            .padding(.top, 8)

                        ForEach(groups) { group in
                            VStack(alignment: .leading, spacing: 0) {
                                HStack {
                                    Text(group.title)
                                        .font(.system(size: 13, weight: .medium))
                                        .foregroundStyle(Color.peepTextSec)
                                    Spacer()
                                    Text("\(group.events.count)")
                                        .font(.system(size: 13))
                                        .foregroundStyle(Color.peepTextTer)
                                }
                                .padding(.horizontal, 20)
                                .padding(.bottom, 8)

                                ForEach(Array(group.events.enumerated()), id: \.element.id) { idx, event in
                                    NavigationLink(value: event) {
                                        EventRow(event: event)
                                            .padding(.horizontal, 20)
                                    }
                                    .buttonStyle(.plain)
                                    if idx < group.events.count - 1 {
                                        Divider()
                                            .background(Color.peepSep)
                                            .padding(.horizontal, 20)
                                    }
                                }
                            }
                        }
                        Spacer(minLength: 100)
                    }
                }
            }
            .navigationBarHidden(true)
            .navigationDestination(for: Event.self) { event in
                EventDetailView(event: event)
            }
        }
    }
}

#Preview {
    ActivityView()
        .environmentObject(AppState())
}
