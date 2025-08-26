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
import UIKit
@preconcurrency import WebKit

// Add protocol for handling link clicks
protocol WebViewLinkDelegate: AnyObject {
  func webView(_ webView: WKWebView, shouldOpenURL url: URL)
}

enum WebViewManager {
  // Public observable state
  static var state = WebViewState()

  // Shared instance and lifecycle
  private(set) static var shared: WKWebView?
  private static weak var currentHost: UIView?
  private static var observersAdded = false
  private static var destroyWorkItem: DispatchWorkItem?

  // Readiness and pending scripts
  private static var isReady = false
  private static var pendingJavaScripts: [String] = []

  // Last known URL and replayable state (dynamic key-value, like JS object)
  private static var lastURL: String?
  private static var lastState: [String: Any] = [:]

  // MARK: - Public API

  public static func initializeLifecycleObservers() {
    guard !observersAdded else { return }
    observersAdded = true

    NotificationCenter.default.addObserver(
      forName: UIApplication.didEnterBackgroundNotification,
      object: nil,
      queue: .main
    ) { _ in
      didEnterBackground()
    }

    NotificationCenter.default.addObserver(
      forName: UIApplication.willEnterForegroundNotification,
      object: nil,
      queue: .main
    ) { _ in
      willEnterForeground()
    }
  }

  public static func cleanupLifecycleObservers() {
    guard observersAdded else { return }
    observersAdded = false

    // Remove notification observers
    NotificationCenter.default.removeObserver(
      self,
      name: UIApplication.didEnterBackgroundNotification,
      object: nil
    )

    NotificationCenter.default.removeObserver(
      self,
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )

    // Cancel any pending destroy work item
    destroyWorkItem?.cancel()
    destroyWorkItem = nil
  }

  public static func evaluateJavaScript(_ js: String) {
    DispatchQueue.main.async {
      // Queue until ready/loading completed
      guard let webView = shared, webView.url != nil, !webView.isLoading, isReady else {
        pendingJavaScripts.append(js)
        return
      }
      webView.evaluateJavaScript(js)
    }
  }

  public static func load(_ urlString: String) {
    DispatchQueue.main.async {
      lastURL = urlString
      let webView = getOrCreate()
      guard let url = URL(string: urlString) else { return }
      if webView.url == url && !webView.isLoading { return }
      isReady = false
      if url.scheme == "file" {
        if let localHtml = resolveLocalHTML(from: urlString) {
          webView.loadFileURL(
            localHtml, allowingReadAccessTo: localHtml.deletingLastPathComponent())
          debugPrint("load local html: \(localHtml.absoluteString)")
        } else {
          debugPrint("Invalid local html url: \(urlString)")
        }
      } else {
        webView.load(URLRequest(url: url))
        debugPrint("load remote html: \(url.absoluteString)")
      }
    }
  }

  public static func attach(to host: UIView) {
    DispatchQueue.main.async {
      let webView = getOrCreate()

      // Move from previous host if needed
      if webView.superview !== host {
        webView.removeFromSuperview()
        host.addSubview(webView)
      }
      currentHost = host
    }
  }

  public static func detach(from host: UIView) {
    DispatchQueue.main.async {
      guard currentHost === host else { return }
      currentHost = nil
      // Do not remove subview immediately; releasing is handled by background logic
    }
  }

  public static func updateFrame(_ rect: CGRect) {
    DispatchQueue.main.async {
      guard let webView = shared else { return }
      webView.frame = rect
      webView.scrollView.frame = rect
    }
  }

  public static func markReadyAndFlush() {
    DispatchQueue.main.async {
      isReady = true
      flushPendingScripts()
    }
  }

  public static func handleProcessTerminated() {
    DispatchQueue.main.async {
      // Try to reload last URL and replay state
      isReady = false
      if let urlString = lastURL {
        load(urlString)
      }
      replayState()
    }
  }

  // Generic state recorders
  public static func record(key: String, value: Any) {
    lastState[key] = value
  }
  public static func recordJSON(key: String, payload: String?) {
    guard let payload else {
      lastState[key] = NSNull()
      return
    }
    if let data = payload.data(using: .utf8),
      let obj = try? JSONSerialization.jsonObject(with: data)
    {
      lastState[key] = obj
    } else {
      // Store raw string if not valid JSON
      lastState[key] = payload
    }
  }

  // MARK: - Internals

  @discardableResult
  static func getOrCreate() -> WKWebView {
    if let webView = shared { return webView }
    let webView = FOWebView(frame: .zero, state: state)
    shared = webView
    return webView
  }

  private static func flushPendingScripts() {
    guard let webView = shared, webView.url != nil, !webView.isLoading, isReady else { return }
    let scripts = pendingJavaScripts
    pendingJavaScripts.removeAll()
    for js in scripts {
      webView.evaluateJavaScript(js)
    }
  }

  private static func replayState() {
    guard let json = buildStateJSON() else { return }
    let call =
      "(function(){ if (window.__FO_BRIDGE__ && typeof window.__FO_BRIDGE__.applyState === 'function') { window.__FO_BRIDGE__.applyState(JSON.parse(\(jsonString(json)))); } })()"
    pendingJavaScripts.append(call)
    flushPendingScripts()
  }

  private static func buildStateJSON() -> String? {
    guard JSONSerialization.isValidJSONObject(lastState) else {
      // Try to sanitize by converting non-JSON types to string
      var sanitized: [String: Any] = [:]
      for (k, v) in lastState {
        if JSONSerialization.isValidJSONObject([k: v]) {
          sanitized[k] = v
        } else {
          sanitized[k] = String(describing: v)
        }
      }
      if let data = try? JSONSerialization.data(withJSONObject: sanitized, options: []) {
        return String(data: data, encoding: .utf8)
      }
      return nil
    }
    if let data = try? JSONSerialization.data(withJSONObject: lastState, options: []) {
      return String(data: data, encoding: .utf8)
    }
    return nil
  }

  private static func jsonString(_ value: String) -> String {
    // Wrap as JSON string literal
    let data = try? JSONSerialization.data(withJSONObject: ["v": value], options: [])
    if let data = data, let s = String(data: data, encoding: .utf8) {
      // {"v":"..."}
      if let range = s.range(of: ":") {
        return String(s[range.upperBound..<s.index(before: s.endIndex)])
      }
    }
    // Fallback naive escaping
    let escaped = value.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(
      of: "\"", with: "\\\"")
    return "\"\(escaped)\""
  }

  private static func didEnterBackground() {
    // If not attached to a host, schedule destroy to save memory
    guard currentHost == nil else { return }
    destroyWorkItem?.cancel()
    let work = DispatchWorkItem { destroyWebView() }
    destroyWorkItem = work
    DispatchQueue.main.asyncAfter(deadline: .now() + 3.0, execute: work)
  }

  private static func willEnterForeground() {
    destroyWorkItem?.cancel()
    // Prewarm by recreating and loading lastURL
    if shared == nil {
      _ = getOrCreate()
      if let urlString = lastURL {
        load(urlString)
      }
      replayState()
    }
  }

  private static func destroyWebView() {
    guard let webView = shared else { return }
    isReady = false
    pendingJavaScripts.removeAll()

    // Detach and cleanup on main thread
    if Thread.isMainThread {
      cleanup(webView)
    } else {
      DispatchQueue.main.sync { cleanup(webView) }
    }

    shared = nil
  }

  private static func cleanup(_ webView: WKWebView) {
    webView.stopLoading()
    webView.navigationDelegate = nil
    webView.uiDelegate = nil
    if let fo = webView as? FOWebView {
      fo.configuration.userContentController.removeScriptMessageHandler(forName: "message")
    }
    webView.removeFromSuperview()

    debugPrint("destroy webview: \(debugState())")
  }

  // MARK: - Debug helpers
  public static func debugState() -> [String: Any] {
    var dict: [String: Any] = [:]
    dict["hasWebView"] = shared != nil
    dict["hasHost"] = currentHost != nil
    dict["ready"] = isReady
    dict["pending"] = pendingJavaScripts.count
    dict["lastURL"] = lastURL ?? NSNull()
    dict["contentHeight"] = Double(state.contentHeight)
    dict["keys"] = Array(lastState.keys)
    return dict
  }

  public static func destroyForDebug() {
    destroyWebView()
  }

  public static func reloadLastURL() {
    if let url = lastURL { load(url) }
  }

  public static func flushForDebug() {
    flushPendingScripts()
  }

  private static func resolveLocalHTML(from fileURL: String) -> URL? {
    // Map RN-provided file:// path to actual bundle resource url
    if let url = URL(string: fileURL), url.scheme == "file" {
      let directoryPath = url.deletingLastPathComponent().absoluteString.replacingOccurrences(
        of: "file://", with: "")
      let fileName = url.lastPathComponent
      let fileExtension = url.pathExtension
      if let fileURL = Bundle.main.url(
        forResource: String(fileName.dropLast(Int(fileExtension.count) + 1)),
        withExtension: fileExtension,
        subdirectory: directoryPath
      ) {
        return fileURL
      } else {
        return nil
      }
    }
    return nil
  }

  // Existing method preserved
  static func presentModalWebView(
    url: URL, from viewController: UIViewController, onDismiss: (() -> Void)? = nil
  ) {
    let safariVC = SafariViewController(url: url)
    safariVC.view.tintColor = Utils.accentColor
    safariVC.preferredControlTintColor = Utils.accentColor

    if let onDismiss = onDismiss { safariVC.setOnDismiss(onDismiss) }
    viewController.present(safariVC, animated: true)
  }
}

// SwiftUI wrapper for the shared WKWebView (debug/internals)
struct SharedWebViewUI: UIViewRepresentable {
  func makeUIView(context: Context) -> WKWebView {
    return WebViewManager.getOrCreate()
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

private class SafariViewController: SFSafariViewController {
  private var onDismiss: (() -> Void)?

  public func setOnDismiss(_ onDismiss: @escaping () -> Void) {
    self.onDismiss = onDismiss
  }

  override func viewDidDisappear(_ animated: Bool) {
    super.viewDidDisappear(animated)
    onDismiss?()
  }
}
