import Combine
import ExpoModulesCore
import SwiftUI
import WebKit

class WebViewView: ExpoView {
    private var cancellable: AnyCancellable?

    private let rctView = ExpoModulesCore.RCTView(frame: .zero)

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        addSubview(rctView)
      
      #if DEBUG
      rctView.borderStyle = .solid
      rctView.borderWidth = 1
      rctView.borderColor = .tintColor
      #endif
        rctView.addSubview(SharedWebViewModule.sharedWebView!)

        clipsToBounds = true

        cancellable = WebViewManager.state.$contentHeight
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.layoutSubviews()
            }
    }

    deinit {
        cancellable?.cancel()
    }

    private let onContentHeightChange = ExpoModulesCore.EventDispatcher()

    override func layoutSubviews() {
        let rect = CGRect(
            x: bounds.origin.x,
            y: bounds.origin.y,
            width: bounds.width,
            height: WebViewManager.state.contentHeight
        )

        SharedWebViewModule.sharedWebView!.frame = rect

        frame = rect

        rctView.frame = rect

      onContentHeightChange(["height": Float(rect.height)])

    }
}

struct WebViewComponent: UIViewRepresentable {
    let webView: WKWebView

    func makeUIView(context: Context) -> WKWebView {
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}
}
