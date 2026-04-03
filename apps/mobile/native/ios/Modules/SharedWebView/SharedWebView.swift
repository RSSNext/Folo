import Combine
import ExpoModulesCore
import SnapKit
import SwiftUI
import WebKit

class WebViewView: ExpoView {
    private var cancellable: AnyCancellable?
    private var lastReportedHeight: CGFloat = 0

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)

        clipsToBounds = true
        cancellable = WebViewManager.state.$contentHeight
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                self?.setNeedsLayout()
            }
    }
   
    deinit {
        cancellable?.cancel()
    }

    private let onContentHeightChange = ExpoModulesCore.EventDispatcher()

    override func layoutSubviews() {
        super.layoutSubviews()
        let rect = CGRect(
            x: 0,
            y: 0,
            width: bounds.width,
            height: WebViewManager.state.contentHeight
        )
        WebViewManager.updateFrame(rect)
        if abs(lastReportedHeight - rect.height) > 0.5 {
            lastReportedHeight = rect.height
            onContentHeightChange(["height": Float(rect.height)])
        }

    }

    override func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil {
            WebViewManager.attach(to: self)
        } else {
            WebViewManager.detach(from: self)
        }
    }
}
