import SwiftUI

struct SettingsView: View {
    // Notifications
    @AppStorage("peep.notif.push")          private var pushAlerts: Bool = true
    @AppStorage("peep.notif.criticalOnly")  private var criticalOnly: Bool = false
    @State private var quietStart: Date = Calendar.current.date(bySettingHour: 22, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var quietEnd:   Date = Calendar.current.date(bySettingHour: 7,  minute: 0, second: 0, of: Date()) ?? Date()

    // Detection
    @AppStorage("peep.detect.loiterThreshold") private var loiterThreshold: Double = 6.0
    @AppStorage("peep.detect.fireOnce")        private var fireOnce: Bool = true
    @AppStorage("peep.detect.requireMovement") private var requireMovement: Bool = true

    // Animals
    @State private var animals: [AnimalToggle] = [
        AnimalToggle(name: "Dog",  emoji: "🐕", on: true),
        AnimalToggle(name: "Cat",  emoji: "🐈", on: true),
        AnimalToggle(name: "Bird", emoji: "🐦", on: false),
        AnimalToggle(name: "Bear", emoji: "🐻", on: true)
    ]

    // Auto-actions
    @AppStorage("peep.auto.refundOnTheft")     private var refundOnTheft: Bool = true
    @AppStorage("peep.auto.claimOnMissing")    private var claimOnMissing: Bool = true
    @AppStorage("peep.auto.notifyOnMissing")   private var notifyOnMissing: Bool = true

    var body: some View {
        NavigationStack {
            Form {
                Section("Notifications") {
                    Toggle("Push alerts", isOn: $pushAlerts)
                    Toggle("Critical only", isOn: $criticalOnly)
                    DatePicker("Quiet hours start", selection: $quietStart, displayedComponents: .hourAndMinute)
                    DatePicker("Quiet hours end",   selection: $quietEnd,   displayedComponents: .hourAndMinute)
                }

                Section("Detection") {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Loitering threshold")
                            Spacer()
                            Text(String(format: "%.1fs", loiterThreshold))
                                .font(.system(.subheadline, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        Slider(value: $loiterThreshold, in: 1...15, step: 0.5)
                            .tint(.peepAccent)
                    }
                    Toggle("Fire once per session", isOn: $fireOnce)
                    Toggle("Require movement", isOn: $requireMovement)
                }

                Section("Animals") {
                    ForEach($animals) { $animal in
                        Toggle(isOn: $animal.on) {
                            HStack(spacing: 10) {
                                Text(animal.emoji)
                                Text(animal.name)
                            }
                        }
                    }
                }

                Section("Auto-actions") {
                    Toggle("Auto-file refund on theft", isOn: $refundOnTheft)
                    Toggle("Auto-file claim on missing delivery", isOn: $claimOnMissing)
                    Toggle("Notify when expected package doesn't arrive", isOn: $notifyOnMissing)
                }

                Section("Integrations") {
                    IntegrationRow(
                        icon: "cart.fill",
                        title: "Amazon",
                        status: "Connected",
                        statusColor: .peepAccent
                    )
                    IntegrationRow(
                        icon: "envelope.fill",
                        title: "Gmail",
                        status: "Connect",
                        statusColor: .accentColor
                    )
                    IntegrationRow(
                        icon: "shield.lefthalf.filled",
                        title: "Police",
                        status: "Coming soon",
                        statusColor: .secondary
                    )
                }

                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("0.1.0")
                            .font(.system(.subheadline, design: .monospaced))
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

private struct AnimalToggle: Identifiable {
    let id = UUID()
    let name: String
    let emoji: String
    var on: Bool
}

private struct IntegrationRow: View {
    let icon: String
    let title: String
    let status: String
    let statusColor: Color

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.body.weight(.semibold))
                .frame(width: 28, height: 28)
                .background(Color.peepAccent.opacity(0.15), in: RoundedRectangle(cornerRadius: 7, style: .continuous))
                .foregroundStyle(Color.peepAccent)
            Text(title)
            Spacer()
            Text(status)
                .font(.subheadline.weight(.medium))
                .foregroundStyle(statusColor)
        }
    }
}

#Preview {
    SettingsView()
        .preferredColorScheme(.dark)
}
