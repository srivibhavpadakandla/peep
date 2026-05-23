import SwiftUI

struct InboxView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showAdd = false

    var body: some View {
        PeepScreen {
            VStack(alignment: .leading, spacing: 14) {
                header
                ScrollView {
                    VStack(spacing: 10) {
                        if appState.deliveries.isEmpty {
                            emptyState.padding(.top, 60)
                        } else {
                            ForEach(appState.deliveries) { d in
                                deliveryCard(d)
                            }
                        }
                        connectGmail
                        Spacer(minLength: 110)
                    }
                    .padding(.horizontal, 16)
                    .padding(.top, 4)
                }
            }
        }
        .sheet(isPresented: $showAdd) {
            AddDeliverySheet { orderID, item, carrier in
                appState.addDelivery(orderID: orderID, item: item, carrier: carrier)
            }
            .presentationDetents([.medium, .large])
        }
    }

    private var header: some View {
        HStack(alignment: .firstTextBaseline) {
            Text("Inbox")
                .font(.system(size: 28, weight: .semibold))
                .tracking(-0.4)
                .foregroundStyle(Color.peepText)
            Spacer()
            Button {
                showAdd = true
            } label: {
                Text("Add")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.peepText)
                    .padding(.horizontal, 10).padding(.vertical, 4)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 16)
        .padding(.top, 4)
    }

    private func deliveryCard(_ d: ExpectedDelivery) -> some View {
        PeepSurface(padding: 14) {
            VStack(alignment: .leading, spacing: 6) {
                Text(d.item)
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Color.peepText)
                Text("\(d.carrier) · \(d.orderID)")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Color.peepTextSec)
                HStack {
                    statusPill(received: d.received)
                    Spacer()
                    Button {
                        appState.toggleDelivery(d)
                    } label: {
                        Text(d.received ? "Mark pending" : "Mark received")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(d.received ? Color.peepBg : Color.peepText)
                            .padding(.horizontal, 10).padding(.vertical, 6)
                            .background(
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .fill(d.received ? Color.peepText : Color.peepSurface)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 8, style: .continuous)
                                    .stroke(Color.peepSep, lineWidth: 0.5)
                            )
                    }
                    .buttonStyle(.plain)
                }
                .padding(.top, 4)
            }
        }
    }

    private func statusPill(received: Bool) -> some View {
        let color: Color = received ? Color.peepAccent
                                    : Color(red: 0.78, green: 0.66, blue: 0.40)
        return Text(received ? "Received" : "Pending")
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(Capsule().fill(color.opacity(0.14)))
            .overlay(Capsule().stroke(color.opacity(0.4), lineWidth: 0.5))
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "tray")
                .font(.system(size: 36, weight: .light))
                .foregroundStyle(Color.peepTextTer)
            Text("No deliveries today.\nPeep is still watching.")
                .font(.system(size: 14))
                .foregroundStyle(Color.peepTextSec)
                .multilineTextAlignment(.center)
                .lineSpacing(4)
            PeepPrimaryButton(title: "Add a package", fillWidth: false) {
                showAdd = true
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 40)
    }

    private var connectGmail: some View {
        PeepSurface(padding: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Connect Gmail")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(Color.peepText)
                Text("Let Peep watch for shipping notifications and auto-add expected deliveries.")
                    .font(.system(size: 13))
                    .foregroundStyle(Color.peepTextSec)
                    .lineSpacing(2)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

// MARK: - Add delivery sheet

private struct AddDeliverySheet: View {
    let onAdd: (_ orderID: String, _ item: String, _ carrier: String) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var carrier = "Amazon"
    @State private var item = ""
    @State private var orderID = ""

    private let carriers = ["Amazon", "UPS", "FedEx", "USPS", "Other"]

    var body: some View {
        PeepScreen {
            VStack(alignment: .leading, spacing: 18) {
                HStack {
                    Text("Expecting a package")
                        .font(.system(size: 22, weight: .semibold))
                        .tracking(-0.3)
                        .foregroundStyle(Color.peepText)
                    Spacer()
                    Button("Done") { dismiss() }
                        .font(.system(size: 14))
                        .foregroundStyle(Color.peepTextSec)
                }
                VStack(alignment: .leading, spacing: 6) {
                    fieldLabel("Carrier")
                    LazyVGrid(columns: [GridItem(.adaptive(minimum: 90), spacing: 6)],
                              alignment: .leading, spacing: 6) {
                        ForEach(carriers, id: \.self) { c in
                            PeepPill(title: c, selected: c == carrier, compact: true) {
                                carrier = c
                            }
                        }
                    }
                }
                VStack(alignment: .leading, spacing: 6) {
                    fieldLabel("Item")
                    textField($item, placeholder: "Anker PowerCore 20K Portable Charger")
                }
                VStack(alignment: .leading, spacing: 6) {
                    fieldLabel("Order ID (optional)")
                    textField($orderID, placeholder: "112-4490023-1188776")
                        .font(.system(size: 15, design: .monospaced))
                }
                Spacer()
                Button {
                    let id = orderID.isEmpty ? "TBD-\(Int.random(in: 1000...9999))" : orderID
                    onAdd(id, item, carrier)
                    dismiss()
                } label: {
                    Text("Watch for it")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(item.isEmpty ? Color.peepTextSec : Color.peepBg)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .fill(item.isEmpty ? Color.peepSurface3 : Color.peepText)
                        )
                }
                .buttonStyle(.plain)
                .disabled(item.isEmpty)
            }
            .padding(.horizontal, 20)
            .padding(.top, 20)
            .padding(.bottom, 24)
        }
    }

    private func fieldLabel(_ s: String) -> some View {
        Text(s)
            .font(.system(size: 12, weight: .medium))
            .foregroundStyle(Color.peepTextSec)
    }

    private func textField(_ binding: Binding<String>, placeholder: String) -> some View {
        TextField(placeholder, text: binding)
            .font(.system(size: 15))
            .foregroundStyle(Color.peepText)
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color.peepSurface2)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .stroke(Color.peepSep, lineWidth: 0.5)
            )
    }
}

#Preview {
    InboxView()
        .environmentObject(AppState())
        .preferredColorScheme(.light)
}
