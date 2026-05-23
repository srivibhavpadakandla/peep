import SwiftUI
import WebKit

struct ContentView: View {
    var body: some View {
        PeepWebView()
            .ignoresSafeArea()
            .background(Color(red: 0.96, green: 0.95, blue: 0.92))
    }
}

struct PeepWebView: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.javaScriptCanOpenWindowsAutomatically = false
        config.allowsInlineMediaPlayback = true
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.bounces = false
        webView.scrollView.isScrollEnabled = false
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.96, green: 0.95, blue: 0.92, alpha: 1)
        webView.scrollView.backgroundColor = .clear

        guard let webRoot = Bundle.main.url(forResource: "Web", withExtension: nil),
              let indexURL = Bundle.main.url(
                  forResource: "index", withExtension: "html", subdirectory: "Web"
              ) else {
            return webView
        }
        webView.loadFileURL(indexURL, allowingReadAccessTo: webRoot)
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}

#Preview {
    ContentView()
}
