import SwiftUI

struct InboxView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            Group {
                if appState.deliveries.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(appState.deliveries) { delivery in
                                DeliveryCard(delivery: delivery) {
                                    appState.toggleDelivery(delivery)
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                        .padding(.top, 8)
                        .padding(.bottom, 24)
                    }
                }
            }
            .navigationTitle("Inbox")
            .navigationBarTitleDisplayMode(.large)
            .background(Color(.systemBackground))
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "tray.fill")
                .font(.system(size: 48))
                .foregroundStyle(.secondary)
            Text("No deliveries today. Peep is still watching.")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(40)
    }
}

private struct DeliveryCard: View {
    let delivery: ExpectedDelivery
    let toggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(delivery.orderID)
                .font(.system(.caption, design: .monospaced))
                .foregroundStyle(.secondary)

            Text(delivery.item)
                .font(.body.weight(.medium))
                .fixedSize(horizontal: false, vertical: true)

            HStack {
                Spacer()
                Button(action: toggle) {
                    HStack(spacing: 6) {
                        Circle()
                            .fill(delivery.received ? Color.peepAccent : Color.severityWarning)
                            .frame(width: 6, height: 6)
                        Text(delivery.received ? "Received" : "Pending")
                            .font(.footnote.weight(.semibold))
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(
                        Capsule().fill(
                            (delivery.received ? Color.peepAccent : Color.severityWarning)
                                .opacity(0.15)
                        )
                    )
                    .overlay(
                        Capsule().stroke(
                            (delivery.received ? Color.peepAccent : Color.severityWarning)
                                .opacity(0.4),
                            lineWidth: 0.5
                        )
                    )
                    .foregroundStyle(delivery.received ? Color.peepAccent : Color.severityWarning)
                }
                .buttonStyle(.plain)
            }
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.secondarySystemBackground))
        )
    }
}

#Preview {
    InboxView()
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
