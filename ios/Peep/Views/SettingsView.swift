import SwiftUI

/// Settings — grouped Form. Sage accent shows up only on actions (toggles
/// on-state, primary CTA). Integration rows are text-only: no avatar tiles,
/// status labels just colored typography.
struct SettingsView: View {
    @AppStorage("peep.notif.push")          private var pushAlerts: Bool = true
    @AppStorage("peep.notif.criticalOnly")  private var criticalOnly: Bool = false
    @State private var quietStart: Date = Calendar.current.date(bySettingHour: 22, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var quietEnd:   Date = Calendar.current.date(bySettingHour: 7,  minute: 0, second: 0, of: Date()) ?? Date()

    @AppStorage("peep.detect.loiterThreshold") private var loiterThreshold: Double = 6.0
    @AppStorage("peep.detect.fireOnce")        private var fireOnce: Bool = true
    @AppStorage("peep.detect.requireMovement") private var requireMovement: Bool = true

    @State private var animals: [AnimalToggle] = [
        AnimalToggle(name: "Dog", on: true),
        AnimalToggle(name: "Cat", on: true),
        AnimalToggle(name: "Bird", on: false),
        AnimalToggle(name: "Bear", on: true)
    ]

    @AppStorage("peep.auto.refundOnTheft")   private var refundOnTheft: Bool = true
    @AppStorage("peep.auto.claimOnMissing")  private var claimOnMissing: Bool = true
    @AppStorage("peep.auto.notifyOnMissing") private var notifyOnMissing: Bool = true

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    Toggle("Push alerts", isOn: $pushAlerts)
                    Toggle("Critical only", isOn: $criticalOnly)
                    DatePicker("Quiet hours start", selection: $quietStart, displayedComponents: .hourAndMinute)
                    DatePicker("Quiet hours end",   selection: $quietEnd,   displayedComponents: .hourAndMinute)
                } header: {
                    Text("Notifications")
                }

                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Loitering threshold")
                            Spacer()
                            Text(String(format: "%.1fs", loiterThreshold))
                                .font(.system(size: 14, design: .monospaced))
                                .foregroundStyle(Color.peepTextSec)
                        }
                        Slider(value: $loiterThreshold, in: 1...15, step: 0.5)
                            .tint(Color.peepAccent)
                    }
                    Toggle("Fire once per session", isOn: $fireOnce)
                    Toggle("Require movement", isOn: $requireMovement)
                } header: {
                    Text("Detection")
                }

                Section {
                    ForEach($animals) { $animal in
                        Toggle(animal.name, isOn: $animal.on)
                    }
                } header: {
                    Text("Animals")
                }

                Section {
                    Toggle("Auto-file refund on theft", isOn: $refundOnTheft)
                    Toggle("Auto-file claim on missing delivery", isOn: $claimOnMissing)
                    Toggle("Notify when expected package doesn't arrive", isOn: $notifyOnMissing)
                } header: {
                    Text("Auto-actions")
                }

                Section {
                    IntegrationRow(title: "Amazon",  status: "Connected",   statusColor: Color.peepAccent)
                    IntegrationRow(title: "Gmail",   status: "Connect",     statusColor: Color.peepAccent)
                    IntegrationRow(title: "Police",  status: "Coming soon", statusColor: Color.peepTextSec)
                } header: {
                    Text("Integrations")
                }

                Section {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("0.1.0")
                            .font(.system(size: 14, design: .monospaced))
                            .foregroundStyle(Color.peepTextSec)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(Color.peepBg)
            .tint(Color.peepAccent)
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.large)
        }
    }
}

private struct AnimalToggle: Identifiable {
    let id = UUID()
    let name: String
    var on: Bool
}

private struct IntegrationRow: View {
    let title: String
    let status: String
    let statusColor: Color

    var body: some View {
        HStack {
            Text(title)
            Spacer()
            Text(status)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(statusColor)
        }
    }
}

#Preview {
    SettingsView()
}
