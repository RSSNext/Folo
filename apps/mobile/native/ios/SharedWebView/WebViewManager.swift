//
//  WebViewManager.swift
//  FollowNative
//
//  Created by Innei on 2025/1/31.
//
import Combine
import ExpoModulesCore
import WebKit

enum WebViewManager {
    static let state = WebViewState()
    
    static private(set) var shared: WKWebView = {
        let configuration = WKWebViewConfiguration()
        
        let css = """
            :root { overflow: hidden !important; }
            body { 
                overflow-y: visible !important;
                position: absolute !important;
                width: 100% !important;
                height: auto !important;
                -webkit-overflow-scrolling: touch !important;
            }
        """
        
        let script = WKUserScript(
            source: """
                var style = document.createElement('style');
                style.textContent = '\(css)';
                document.head.appendChild(style);
            """,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        
        configuration.userContentController.addUserScript(script)
        
        let webView = WKWebView(frame: .zero, configuration: configuration)
      webView.scrollView.isScrollEnabled = false
        
         
        #if DEBUG
      if #available(iOS 16.4, *) {
        
        webView.isInspectable = true
      }
        #endif
        
         
        setupWebView(webView)
        
        return webView
    }()
    
    private static func setupWebView(_ webView: WKWebView) {
        let delegate = WebViewDelegate(state: state)
        webView.navigationDelegate = delegate
        
        let script = WKUserScript(
            source: """
                window.addEventListener('load', function() {
                    window.webkit.messageHandlers.contentHeight.postMessage(document.documentElement.scrollHeight);
                });
                
                const observer = new ResizeObserver(function() {
                    window.webkit.messageHandlers.contentHeight.postMessage(document.documentElement.scrollHeight);
                });
                observer.observe(document.documentElement);
            """,
            injectionTime: .atDocumentEnd,
            forMainFrameOnly: true
        )
        
        webView.configuration.userContentController.addUserScript(script)
        webView.configuration.userContentController.add(delegate, name: "contentHeight")
    }
    
    static func resetWebView() {
        let newWebView = WKWebView(frame: .zero, configuration: WKWebViewConfiguration())
        setupWebView(newWebView)
        shared = newWebView
    }
}


// MARK: - WebViewState
private class WebViewDelegate: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
    private let state: WebViewState
    
    init(state: WebViewState) {
        self.state = state
        super.init()
    }
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "contentHeight", let height = message.body as? CGFloat {
            DispatchQueue.main.async {
               
                self.state.contentHeight = height
            }
        }
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("document.documentElement.scrollHeight") { (height, error) in
            if let height = height as? CGFloat {
                DispatchQueue.main.async {
                    self.state.contentHeight = height
                }
            }
        }
    }
}

