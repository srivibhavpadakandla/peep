import SwiftUI

struct SettingsView: View {
    // Notifications
    @AppStorage("peep.notif.push")            private var pushAlerts: Bool = true
    @AppStorage("peep.notif.criticalOnly")    private var criticalOnly: Bool = false
    @State private var quietStart: Date =
        Calendar.current.date(bySettingHour: 22, minute: 0, second: 0, of: Date()) ?? Date()
    @State private var quietEnd: Date =
        Calendar.current.date(bySettingHour: 7,  minute: 0, second: 0, of: Date()) ?? Date()

    // Detection
    @AppStorage("peep.detect.loiterThreshold") private var loiterThreshold: Double = 6.0
    @AppStorage("peep.detect.fireOnce")        private var fireOnce: Bool = true
    @AppStorage("peep.detect.requireMovement") private var requireMovement: Bool = true

    // Animals
    @AppStorage("peep.animals.dog")  private var animalDog: Bool = true
    @AppStorage("peep.animals.cat")  private var animalCat: Bool = true
    @AppStorage("peep.animals.bird") private var animalBird: Bool = false
    @AppStorage("peep.animals.bear") private var animalBear: Bool = true

    // Auto-actions
    @AppStorage("peep.auto.refundOnTheft")   private var refundOnTheft: Bool = true
    @AppStorage("peep.auto.claimOnMissing")  private var claimOnMissing: Bool = true
    @AppStorage("peep.auto.notifyOnMissing") private var notifyOnMissing: Bool = true
    @AppStorage("peep.auto.requireApproval") private var requireApproval: Bool = false

    // Advanced
    @AppStorage("peep.expertMode") private var expertMode: Bool = false

    // Browser-agent endpoint
    @AppStorage("peep.agentURL")   private var agentURL: String = "http://localhost:8787"

    var body: some View {
        PeepScreen {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("Settings")
                        .font(.system(size: 28, weight: .semibold))
                        .tracking(-0.4)
                        .foregroundStyle(Color.peepText)
                        .padding(.horizontal, 20)
                        .padding(.top, 8)

                    section("Notifications") {
                        toggleRow("Push alerts", $pushAlerts)
                        PeepHairline()
                        toggleRow("Critical only", $criticalOnly)
                        PeepHairline()
                        timeRow("Quiet hours start", time: $quietStart)
                        PeepHairline()
                        timeRow("Quiet hours end",   time: $quietEnd)
                    }

                    section("Detection") {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("Loitering threshold")
                                    .font(.system(size: 15))
                                    .foregroundStyle(Color.peepText)
                                Spacer()
                                Text(String(format: "%.1fs", loiterThreshold))
                                    .font(.system(size: 13, design: .monospaced))
                                    .foregroundStyle(Color.peepTextSec)
                            }
                            Slider(value: $loiterThreshold, in: 1...15, step: 0.5)
                                .tint(Color.peepText)
                        }
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        PeepHairline()
                        toggleRow("Fire once per session", $fireOnce)
                        PeepHairline()
                        toggleRow("Require movement", $requireMovement)
                    }

                    section("Animals") {
                        animalRow("🐕", "Dog", $animalDog)
                        PeepHairline()
                        animalRow("🐈", "Cat", $animalCat)
                        PeepHairline()
                        animalRow("🐦", "Bird", $animalBird)
                        PeepHairline()
                        animalRow("🐻", "Bear", $animalBear)
                    }

                    section("Auto-actions",
                            footer: "Peep will always send a push notification before any auto-action is filed.") {
                        toggleRow("Auto-file refund on theft", $refundOnTheft)
                        PeepHairline()
                        toggleRow("Auto-file claim on missing delivery", $claimOnMissing)
                        PeepHairline()
                        toggleRow("Alert if expected package doesn't arrive", $notifyOnMissing)
                        PeepHairline()
                        toggleRow("Require approval before filing", $requireApproval)
                    }

                    section("Integrations") {
                        integrationRow(icon: "cart.fill", title: "Amazon",
                                       status: "Connected", statusColor: Color.peepAccent)
                        PeepHairline()
                        integrationRow(icon: "envelope.fill", title: "Gmail",
                                       status: "Connect", statusColor: Color.severityHigh)
                        PeepHairline()
                        integrationRow(icon: "shield.lefthalf.filled", title: "Police",
                                       status: "Coming soon", statusColor: Color.peepTextSec)
                    }

                    section("Advanced",
                            footer: "Expert mode shows raw confidence scores, metadata keys, and the technical agent log.") {
                        toggleRow("Expert mode", $expertMode)
                    }

                    section("Browser agent",
                            footer: "URL of the local agentic-server. On a physical device, use your Mac's LAN IP, e.g. http://192.168.1.42:8787") {
                        HStack {
                            Text("Endpoint")
                                .font(.system(size: 15))
                                .foregroundStyle(Color.peepText)
                            Spacer()
                            TextField("http://localhost:8787", text: $agentURL)
                                .font(.system(size: 13, design: .monospaced))
                                .foregroundStyle(Color.peepTextSec)
                                .multilineTextAlignment(.trailing)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .submitLabel(.done)
                        }
                        .padding(.horizontal, 16).padding(.vertical, 12)
                    }

                    appInfo
                    tagline
                    Spacer(minLength: 110)
                }
            }
        }
    }

    // MARK: - Section primitive

    @ViewBuilder
    private func section<Content: View>(_ title: String,
                                        footer: String? = nil,
                                        @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 0) {
            PeepSectionTitle(text: title)
            VStack(spacing: 0) { content() }
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Color.peepSurface)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .stroke(Color.peepSep, lineWidth: 0.5)
                )
                .padding(.horizontal, 16)
            if let footer {
                Text(footer)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.peepTextSec)
                    .lineSpacing(2)
                    .padding(.horizontal, 20)
                    .padding(.top, 8)
            }
        }
    }

    private func toggleRow(_ label: String, _ binding: Binding<Bool>) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 15))
                .foregroundStyle(Color.peepText)
            Spacer()
            PeepToggle(isOn: binding)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }

    private func timeRow(_ label: String, time: Binding<Date>) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 15))
                .foregroundStyle(Color.peepText)
            Spacer()
            DatePicker("", selection: time, displayedComponents: .hourAndMinute)
                .labelsHidden()
                .tint(Color.peepText)
        }
        .padding(.horizontal, 16).padding(.vertical, 8)
    }

    private func animalRow(_ emoji: String, _ name: String, _ binding: Binding<Bool>) -> some View {
        HStack(spacing: 10) {
            Text(emoji).font(.system(size: 18))
            Text(name)
                .font(.system(size: 15))
                .foregroundStyle(Color.peepText)
            Spacer()
            PeepToggle(isOn: binding)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }

    private func integrationRow(icon: String, title: String, status: String, statusColor: Color) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.peepAccent)
                .frame(width: 28, height: 28)
                .background(
                    RoundedRectangle(cornerRadius: 7, style: .continuous)
                        .fill(Color.peepAccent.opacity(0.14))
                )
            Text(title)
                .font(.system(size: 15))
                .foregroundStyle(Color.peepText)
            Spacer()
            Text(status)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(statusColor)
        }
        .padding(.horizontal, 16).padding(.vertical, 12)
    }

    private var appInfo: some View {
        HStack(spacing: 14) {
            // App icon block
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.peepText)
                .frame(width: 64, height: 64)
                .overlay(
                    Text("P")
                        .font(.system(size: 30, weight: .bold))
                        .foregroundStyle(Color.peepBg)
                )
            VStack(alignment: .leading, spacing: 2) {
                Text("Peep")
                    .font(.system(size: 18, weight: .bold))
                    .tracking(-0.2)
                    .foregroundStyle(Color.peepText)
                Text("v0.1.0")
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Color.peepTextSec)
            }
            Spacer()
            Button("About") {}
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(Color.peepAccent)
                .padding(.horizontal, 12).padding(.vertical, 7)
                .background(
                    RoundedRectangle(cornerRadius: 10, style: .continuous)
                        .fill(Color.peepSurface2)
                )
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .fill(Color.peepSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .stroke(Color.peepSep, lineWidth: 0.5)
        )
        .padding(.horizontal, 16)
        .padding(.top, 8)
    }

    private var tagline: some View {
        Text("your doorstep just got smarter.")
            .font(.system(size: 11, design: .monospaced))
            .foregroundStyle(Color.peepTextTer)
            .frame(maxWidth: .infinity)
            .padding(.top, 12).padding(.bottom, 20)
    }
}

#Preview {
    SettingsView()
        .preferredColorScheme(.light)
}
