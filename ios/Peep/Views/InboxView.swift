import SwiftUI

/// Inbox — expected deliveries today. Light cards, item name first, order ID
/// in mono caption, "Mark received" / "Mark pending" as a text button on the
/// right (no colored pills).
struct InboxView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        NavigationStack {
            ZStack {
                Color.peepBg.ignoresSafeArea()
                Group {
                    if appState.deliveries.isEmpty {
                        emptyState
                    } else {
                        ScrollView {
                            VStack(alignment: .leading, spacing: 24) {
                                Text("Inbox")
                                    .font(.system(size: 28, weight: .medium))
                                    .foregroundStyle(Color.peepText)
                                    .padding(.horizontal, 20)
                                    .padding(.top, 8)

                                VStack(spacing: 12) {
                                    ForEach(appState.deliveries) { delivery in
                                        DeliveryCard(delivery: delivery) {
                                            appState.toggleDelivery(delivery)
                                        }
                                    }
                                }
                                .padding(.horizontal, 16)

                                Spacer(minLength: 80)
                            }
                        }
                    }
                }
            }
            .navigationBarHidden(true)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("No deliveries today.")
                .font(.system(size: 16))
                .foregroundStyle(Color.peepText)
            Text("Peep is still watching.")
                .font(.system(size: 14))
                .foregroundStyle(Color.peepTextSec)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding(40)
    }
}

private struct DeliveryCard: View {
    let delivery: ExpectedDelivery
    let toggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(delivery.item)
                .font(.system(size: 15, weight: .medium))
                .foregroundStyle(Color.peepText)
                .fixedSize(horizontal: false, vertical: true)
            HStack(alignment: .firstTextBaseline) {
                Text(delivery.orderID)
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Color.peepTextSec)
                Spacer()
                Button(action: toggle) {
                    Text(delivery.received ? "Mark pending" : "Mark received")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Color.peepAccent)
                }
                .buttonStyle(.plain)
            }
            // Status line — text-only, no pill
            Text(delivery.received ? "Received" : "Pending")
                .font(.system(size: 13))
                .foregroundStyle(delivery.received ? Color.peepAccent : Color.peepTextSec)
        }
        .padding(16)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .fill(Color.peepSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color.peepSep, lineWidth: 0.5)
        )
    }
}

#Preview {
    InboxView()
        .environmentObject(AppState())
}
