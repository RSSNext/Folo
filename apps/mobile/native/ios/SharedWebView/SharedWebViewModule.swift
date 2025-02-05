//
//  File.swift
//
//  Created by Innei on 2025/1/29.
//

import ExpoModulesCore
import WebKit

public class SharedWebViewModule: Module {
    public static var sharedWebView: WKWebView? {
        WebViewManager.shared
    }

    public func definition() -> ModuleDefinition {
        Name("FOSharedWebView")

        Function("preload") { (urlString: String) in
            DispatchQueue.main.async {
                self.load(urlString: urlString)
            }
        }

        View(WebViewView.self) {
            Events("onContentHeightChange")

            Prop("url") { (_: UIView, urlString: String) in
                self.load(urlString: urlString)
            }
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

            debugPrint(localHtml)
            if let localHtml = localHtml {

                webView.loadFileURL(
                    localHtml, allowingReadAccessTo: localHtml.deletingLastPathComponent())
                debugPrint("load local html", localHtml)
                return
            }
        }

        if let url = URL(string: urlString) {
            if url == webView.url {
                return
            }
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
