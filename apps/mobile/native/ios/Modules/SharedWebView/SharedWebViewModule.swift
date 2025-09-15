//
//  SharedWebViewModule.swift
//
//  Created by Innei on 2025/1/29.
//

import Combine
import ExpoModulesCore
import WebKit

let onContentHeightChanged = "onContentHeightChanged"
let onImagePreview = "onImagePreview"
let onSeekAudio = "onSeekAudio"

public class SharedWebViewModule: Module {
  private var cancellables = Set<AnyCancellable>()

  public static var sharedWebView: WKWebView? {
    WebViewManager.shared
  }

  public func definition() -> ModuleDefinition {
    Name("FOSharedWebView")

    Function("load") { (urlString: String) in
      WebViewManager.load(urlString)
    }

    Function("evaluateJavaScript") { (js: String) in
      // Prefer typed setters or dispatch to record state; avoid parsing free-form JS
      WebViewManager.evaluateJavaScript(js)
    }

    // Centralized dispatch to JS layer (native -> JS)
    Function("dispatch") { (type: String, payload: String?) in
      let payloadExpr: String
      if let payload = payload {
        // payload is JSON string; pass via JSON.parse to avoid double-escaping
        payloadExpr = "JSON.parse(\(self.jsonString(payload)))"
      } else {
        payloadExpr = "null"
      }
      let js =
        "(function(){ if (window.__FO_BRIDGE__ && typeof window.__FO_BRIDGE__.dispatch === 'function') { window.__FO_BRIDGE__.dispatch(\(self.jsonString(type)), \(payloadExpr)); } })()"
      WebViewManager.recordJSON(key: type, payload: payload)
      WebViewManager.evaluateJavaScript(js)
    }

    View(WebViewView.self) {
      Events("onContentHeightChange")
      Events("onSeekAudio")

      Prop("url") { (_: UIView, urlString: String) in
        WebViewManager.load(urlString)
      }
    }

    Events(onContentHeightChanged)
    Events(onImagePreview)
    Events(onSeekAudio)

    OnCreate {
      WebViewManager.initializeLifecycleObservers()
    }

    OnDestroy {
      WebViewManager.cleanupLifecycleObservers()
    }
    OnStartObserving {
      // Monitor content height changes
      WebViewManager.state.$contentHeight
        .receive(on: DispatchQueue.main)
        .sink { [weak self] height in
          self?.sendEvent(onContentHeightChanged, ["height": height])
        }
        .store(in: &self.cancellables)

      // Monitor image preview events
      WebViewManager.state.$imagePreviewEvent
        .receive(on: DispatchQueue.main)
        .compactMap { $0 }  // Filter out nil values
        .sink { [weak self] event in
          self?.sendEvent(onImagePreview, ["imageUrls": event.imageUrls, "index": event.index])
        }
        .store(in: &self.cancellables)

      WebViewManager.state.$audioSeekEvent
        .receive(on: DispatchQueue.main)
        .compactMap { $0 }
        .sink { [weak self] event in
          self?.sendEvent(onSeekAudio, ["time": event.time])
        }
        .store(in: &self.cancellables)
    }

    OnStopObserving {
      self.cancellables.forEach { $0.cancel() }
      self.cancellables.removeAll()
    }

    // Debug helpers
    Function("getDebugState") { () -> [String: Any] in
      WebViewManager.debugState()
    }
    Function("destroyForDebug") {
      WebViewManager.destroyForDebug()
    }
    Function("reloadLastURL") {
      WebViewManager.reloadLastURL()
    }
    Function("flushQueue") {
      WebViewManager.flushForDebug()
    }
  }

  private func getLocalHTML(from fileURL: String) -> URL? {
    if let url = URL(string: fileURL), url.scheme == "file" {
      let directoryPath = url.deletingLastPathComponent().absoluteString.replacingOccurrences(
        of: "file://", with: ""
      )
      let fileName = url.lastPathComponent
      let fileExtension = url.pathExtension

      if let fileURL = Bundle.main
        .url(
          forResource: String(fileName.dropLast(Int(fileExtension.count) + 1)),
          withExtension: fileExtension,
          subdirectory: directoryPath
        )
      {
        return fileURL
      } else {
        return nil
      }
    } else {
      debugPrint("Invalidate url")
      return nil
    }
  }

  // Removed JS string parsing helpers; state is captured by typed setters or dispatch/setStateJSON

  fileprivate func jsonString(_ value: String) -> String {
    // Encode as JSON string literal
    let data = try? JSONSerialization.data(withJSONObject: ["v": value], options: [])
    if let data = data, let s = String(data: data, encoding: .utf8) {
      if let range = s.range(of: ":") {
        return String(s[range.upperBound..<s.index(before: s.endIndex)])
      }

      let escaped = value.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(
        of: "\"", with: "\\\"")
      return "\"\(escaped)\""
    }
    return ""
  }

  // recordDispatchState removed: dynamic state is recorded directly via WebViewManager.recordJSON
}
