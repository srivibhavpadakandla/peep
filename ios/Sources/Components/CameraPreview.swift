import SwiftUI
import AVFoundation
import Vision

struct Detection: Identifiable, Equatable {
    let id = UUID()
    let rect: CGRect      // normalized, origin top-left, 0..1
    let label: String
    let confidence: Float
}

@MainActor
final class CameraSession: NSObject, ObservableObject {
    let session = AVCaptureSession()
    @Published var status: Status = .idle
    @Published var detections: [Detection] = []

    enum Status { case idle, authorized, denied, failed(String) }

    /// Called once per package_taken / package_arrived detection so the rest
    /// of the app (AppState, Activity feed, active-event card) can react.
    var onEvent: (@MainActor (Event) -> Void)?

    // Vision-driven state machine. Mirrors agentic/vision-agent.jsx on the web.
    enum SMState { case idle, packagePresent, packageTaken }
    private var smState: SMState = .idle
    private var packageFirstSeenAt: Date?
    private var packageLastSeenAt: Date?
    private var cooldownUntil: Date?
    private let presenceThreshold: TimeInterval = 1.0
    private let absenceThreshold:  TimeInterval = 1.2
    private let cooldown:          TimeInterval = 10

    private let videoOutput = AVCaptureVideoDataOutput()
    private let outputQueue = DispatchQueue(label: "com.peep.camera.output")
    nonisolated(unsafe) private var lastDetection: TimeInterval = 0

    func start() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            configureIfNeeded()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                Task { @MainActor in
                    if granted { self?.configureIfNeeded() }
                    else { self?.status = .denied }
                }
            }
        case .denied, .restricted:
            status = .denied
        @unknown default:
            status = .denied
        }
    }

    func stop() {
        guard session.isRunning else { return }
        Task.detached { [session] in session.stopRunning() }
    }

    private func configureIfNeeded() {
        if session.inputs.isEmpty {
            session.beginConfiguration()
            session.sessionPreset = .high
            guard let device = AVCaptureDevice.default(.builtInWideAngleCamera,
                                                       for: .video, position: .back)
                            ?? AVCaptureDevice.default(for: .video),
                  let input = try? AVCaptureDeviceInput(device: device),
                  session.canAddInput(input) else {
                session.commitConfiguration()
                status = .failed("No camera available")
                return
            }
            session.addInput(input)
            videoOutput.alwaysDiscardsLateVideoFrames = true
            videoOutput.videoSettings = [
                kCVPixelBufferPixelFormatTypeKey as String: Int(kCVPixelFormatType_32BGRA)
            ]
            videoOutput.setSampleBufferDelegate(self, queue: outputQueue)
            if session.canAddOutput(videoOutput) {
                session.addOutput(videoOutput)
            }
            session.commitConfiguration()
        }
        status = .authorized
        Task.detached { [session] in
            if !session.isRunning { session.startRunning() }
        }
    }
}

extension CameraSession: AVCaptureVideoDataOutputSampleBufferDelegate {
    nonisolated func captureOutput(_ output: AVCaptureOutput,
                                   didOutput sampleBuffer: CMSampleBuffer,
                                   from connection: AVCaptureConnection) {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }

        // Throttle: ~5 Hz is plenty for an overlay and keeps the device cool.
        let now = CACurrentMediaTime()
        guard now - lastDetection > 0.2 else { return }
        lastDetection = now

        let humans = VNDetectHumanRectanglesRequest()
        humans.upperBodyOnly = false

        let rects = VNDetectRectanglesRequest()
        rects.minimumAspectRatio = 0.4   // accept boxes in portrait or landscape
        rects.maximumAspectRatio = 1.0
        rects.minimumSize = 0.08
        rects.minimumConfidence = 0.7
        rects.maximumObservations = 6
        rects.quadratureTolerance = 25    // tolerate skewed angles

        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer,
                                            orientation: .right,
                                            options: [:])
        try? handler.perform([humans, rects])

        func flip(_ b: CGRect) -> CGRect {
            CGRect(x: b.origin.x,
                   y: 1.0 - b.origin.y - b.size.height,
                   width: b.size.width,
                   height: b.size.height)
        }

        let humanDets = (humans.results ?? []).map {
            Detection(rect: flip($0.boundingBox), label: "person", confidence: $0.confidence)
        }
        let rectDets = (rects.results ?? []).map {
            Detection(rect: flip($0.boundingBox), label: "package", confidence: $0.confidence)
        }
        let combined = humanDets + rectDets
        Task { @MainActor in
            self.detections = combined
            self.advanceStateMachine(humans: humanDets, packages: rectDets)
        }
    }
}

extension CameraSession {
    /// Advance the package_taken state machine. Runs on main actor.
    fileprivate func advanceStateMachine(humans: [Detection], packages: [Detection]) {
        let now = Date()
        if let cd = cooldownUntil, now < cd { return }

        let hasPackage = !packages.isEmpty
        let hasPerson  = !humans.isEmpty

        if hasPackage {
            packageLastSeenAt = now
            if packageFirstSeenAt == nil { packageFirstSeenAt = now }
        }

        switch smState {
        case .idle:
            if hasPackage, let first = packageFirstSeenAt,
               now.timeIntervalSince(first) >= presenceThreshold {
                smState = .packagePresent
                let conf = max(0.85, packages.first?.confidence ?? 0.9)
                emit(.packageArrived, confidence: Double(conf))
            } else if !hasPackage {
                packageFirstSeenAt = nil
            }
        case .packagePresent:
            if !hasPackage, hasPerson,
               let last = packageLastSeenAt,
               now.timeIntervalSince(last) >= absenceThreshold {
                smState = .packageTaken
                cooldownUntil = now.addingTimeInterval(cooldown)
                let conf = max(0.80, humans.first?.confidence ?? 0.85)
                emit(.packageTaken, confidence: Double(conf))
                packageFirstSeenAt = nil
                packageLastSeenAt = nil
            }
        case .packageTaken:
            if let cd = cooldownUntil, now >= cd {
                smState = .idle
                packageFirstSeenAt = nil
                packageLastSeenAt = nil
            }
        }
    }

    private func emit(_ type: EventType, confidence: Double) {
        let event = Event(eventType: type, timestamp: Date(), confidence: confidence)
        onEvent?(event)
    }
}

struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    final class PreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var previewLayer: AVCaptureVideoPreviewLayer {
            layer as! AVCaptureVideoPreviewLayer
        }
    }

    func makeUIView(context: Context) -> PreviewView {
        let v = PreviewView()
        v.previewLayer.session = session
        v.previewLayer.videoGravity = .resizeAspectFill
        v.backgroundColor = .black
        return v
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {
        uiView.previewLayer.session = session
    }
}

struct DetectionOverlay: View {
    let detections: [Detection]

    var body: some View {
        GeometryReader { geo in
            ForEach(detections) { d in
                let r = CGRect(x: d.rect.origin.x * geo.size.width,
                               y: d.rect.origin.y * geo.size.height,
                               width: d.rect.size.width * geo.size.width,
                               height: d.rect.size.height * geo.size.height)
                let color: Color = d.label == "person"
                    ? .peepAccent
                    : Color(red: 0.44, green: 0.42, blue: 0.56)  // package purple
                ZStack(alignment: .topLeading) {
                    Rectangle()
                        .stroke(color, lineWidth: 1.5)
                        .frame(width: r.size.width, height: r.size.height)
                    Text("\(d.label) \(String(format: "%.2f", d.confidence))")
                        .font(.system(size: 10, design: .monospaced))
                        .padding(.horizontal, 4).padding(.vertical, 1)
                        .background(color)
                        .foregroundStyle(.black)
                        .offset(x: 0, y: -14)
                }
                .position(x: r.midX, y: r.midY)
            }
        }
        .allowsHitTesting(false)
    }
}

struct LiveCameraView: View {
    @EnvironmentObject private var appState: AppState
    @StateObject private var camera = CameraSession()

    var body: some View {
        ZStack {
            Color.black
            switch camera.status {
            case .authorized:
                CameraPreview(session: camera.session)
                DetectionOverlay(detections: camera.detections)
            case .denied:
                overlay("Camera access denied",
                        "Enable in Settings → Peep → Camera")
            case .failed(let msg):
                overlay("Camera unavailable", msg)
            case .idle:
                ProgressView().tint(.white)
            }
        }
        .onAppear {
            camera.onEvent = { [weak appState] event in
                appState?.ingest(event)
            }
            camera.start()
        }
        .onDisappear { camera.stop() }
    }

    private func overlay(_ title: String, _ subtitle: String) -> some View {
        VStack(spacing: 6) {
            Text(title).font(.subheadline.weight(.medium)).foregroundStyle(.white)
            Text(subtitle).font(.caption).foregroundStyle(.white.opacity(0.6))
                .multilineTextAlignment(.center)
        }
        .padding(.horizontal, 24)
    }
}
