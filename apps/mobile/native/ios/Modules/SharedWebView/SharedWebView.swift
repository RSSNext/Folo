import Combine
import ExpoModulesCore
import SnapKit
import SwiftUI
import WebKit

class WebViewView: ExpoView {
    private var cancellable: AnyCancellable?

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        addSubview(SharedWebViewModule.sharedWebView!)

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
        guard let webView = SharedWebViewModule.sharedWebView else { return }
        webView.frame = rect
        webView.scrollView.frame = rect

        frame = rect
        onContentHeightChange(["height": Float(rect.height)])

    }
}
