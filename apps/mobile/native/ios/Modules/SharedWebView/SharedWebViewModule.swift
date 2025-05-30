//
//  SharedWebViewModule.swift
//
//  Created by Innei on 2025/1/29.
//

import Combine
import ExpoModulesCore
import WebKit

let onContentHeightChanged = "onContentHeightChanged"

public class SharedWebViewModule: Module {
    private var pendingJavaScripts: [String] = []

    public static var sharedWebView: WKWebView? {
        WebViewManager.shared
    }

    public func definition() -> ModuleDefinition {
        Name("FOSharedWebView")

        Function("load") { (urlString: String) in
            DispatchQueue.main.async {
                self.load(urlString: urlString)
            }
        }

        Function("evaluateJavaScript") { (js: String) in
            DispatchQueue.main.async {
                WebViewManager.evaluateJavaScript(js)
            }
        }

        View(WebViewView.self) {
            Events("onContentHeightChange")

            Prop("url") { (_: UIView, urlString: String) in
                DispatchQueue.main.async {
                    self.load(urlString: urlString)
                }
            }
        }

        Events(onContentHeightChanged)
        var cancellable: AnyCancellable?
        OnStartObserving {
            cancellable = WebViewManager.state.$contentHeight
                .receive(on: DispatchQueue.main)
                .sink { [weak self] height in
                    self?.sendEvent(onContentHeightChanged, ["height": height])
                }
        }
        OnStopObserving {
            cancellable?.cancel()
        }
    }

    private func load(urlString: String) {
        guard let webView = SharedWebViewModule.sharedWebView else {
            return
        }
        // Check is local file
        let urlProtocol = "file://"
        if urlString.starts(with: urlProtocol) {
            let localHtml = self.getLocalHTML(from: urlString)

            if let localHtml = localHtml {
                webView.loadFileURL(
                    localHtml,
                    allowingReadAccessTo: localHtml.deletingLastPathComponent()
                )

                debugPrint("load local html: \(localHtml.absoluteString)")

                return
            }
        }

        if let url = URL(string: urlString) {
            if url == webView.url {
                return
            }
            debugPrint("load remote html: \(url.absoluteString)")
            webView.load(URLRequest(url: url))
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
}
