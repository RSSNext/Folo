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
    private var pendingJavaScripts: [String] = []
    private var cancellables = Set<AnyCancellable>()

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
            Events("onSeekAudio")

            Prop("url") { (_: UIView, urlString: String) in
                DispatchQueue.main.async {
                    self.load(urlString: urlString)
                }
            }
        }

        Events(onContentHeightChanged)
        Events(onImagePreview)
        Events(onSeekAudio)

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
                .compactMap { $0 } // Filter out nil values
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
