//
//  WebViewManager.swift
//  FollowNative
//
//  Created by Innei on 2025/1/31.
//
import Combine
import ExpoModulesCore
import SafariServices
import SwiftUI
@preconcurrency import WebKit

private var pendingJavaScripts: [String] = []

// Add protocol for handling link clicks
protocol WebViewLinkDelegate: AnyObject {
    func webView(_ webView: WKWebView, shouldOpenURL url: URL)
}

enum WebViewManager {
    static var state = WebViewState()

    public static func evaluateJavaScript(_ js: String) {
        DispatchQueue.main.async {
            guard let webView = SharedWebViewModule.sharedWebView else {
                pendingJavaScripts.append(js)
                return
            }
            guard webView.url != nil else {
                pendingJavaScripts.append(js)
                return
            }

            if webView.isLoading {
                pendingJavaScripts.append(js)
            } else {
                webView.evaluateJavaScript(js)
            }
        }
    }

    static private(set) var shared: WKWebView = {
        FOWebView(frame: .zero, state: state)
    }()

    static func resetWebView() {
        self.state = WebViewState()
        self.shared = FOWebView(frame: .zero, state: state)
    }

  static func presentModalWebView(url: URL, from viewController: UIViewController, onDismiss: (() -> Void)? = nil) {
      let safariVC = SafariViewController(url: url)
      safariVC.view.tintColor = Utils.accentColor
      safariVC.preferredControlTintColor = Utils.accentColor
    
      if let onDismiss = onDismiss { safariVC.setOnDismiss(onDismiss) }
      viewController.present(safariVC, animated: true)
    }
}

// SwiftUI wrapper for the shared WKWebView
struct SharedWebViewUI: UIViewRepresentable {
    func makeUIView(context: Context) -> WKWebView {
        return WebViewManager.shared
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {

    }
}

extension WebViewManager {
    static var swiftUIView: some View {
        SharedWebViewUI()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

fileprivate class SafariViewController: SFSafariViewController {
  
  private var onDismiss: (() -> Void)?
  
  public func setOnDismiss(_ onDismiss: @escaping () -> Void) {
    self.onDismiss = onDismiss
  }
  
  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    onDismiss?()
  }
}
