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

        Function("preload") { (url: String) in
            DispatchQueue.main.async {
                guard let webUrl = URL(string: url) else { return }
                let request = URLRequest(url: webUrl)
                WebViewManager.shared.load(request)
            }
        }

        View(WebViewView.self) {
            Events("onContentHeightChange")

            Prop("url") { (_: UIView, urlString: String) in
                if let webView = SharedWebViewModule.sharedWebView {
                    if let url = URL(string: urlString) {
                        if url == webView.url {
                            return
                        }
                        webView.load(URLRequest(url: url))
                    }
                }
            }
        }
    }
}
