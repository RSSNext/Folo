//
//  CustomURLSchemeHandler.swift
//  Pods
//
//  Created by Innei on 2025/2/7.
//

import Foundation
import SDWebImage
import WebKit

class FollowImageURLSchemeHandler: NSObject, WKURLSchemeHandler {
    static let rewriteScheme = "follow-image"
    private var activeTasks: [String: URLSessionDataTask] = [:]
    private var stoppedTasks: Set<String> = []

    private let imageCache = SDImageCache.shared

    private func getCommonHeaders(forImageData data: Data? = nil) -> [String: String] {
        var headers = [
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",

        ]

        if let imageData = data {
            if imageData.starts(with: [0xFF, 0xD8, 0xFF]) {
                headers["Content-Type"] = "image/jpeg"
            } else if imageData.starts(with: [0x89, 0x50, 0x4E, 0x47]) {
                headers["Content-Type"] = "image/png"
            } else if imageData.starts(with: [0x47, 0x49, 0x46]) {
                headers["Content-Type"] = "image/gif"
            } else if imageData.starts(with: [0x52, 0x49, 0x46, 0x46]) {
                headers["Content-Type"] = "image/webp"
            } else {
                headers["Content-Type"] = "application/octet-stream"
            }
        }

        return headers
    }

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url,
            let originalURLString = url.absoluteString.replacingOccurrences(
                of: FollowImageURLSchemeHandler.rewriteScheme, with: "https"
            ).removingPercentEncoding,
            let originalURL = URL(string: originalURLString)
        else {
            urlSchemeTask.didFailWithError(NSError(domain: "", code: -1))
            return
        }

        let cacheKey = originalURL.absoluteString
        if let cachedData = imageCache.diskImageData(forKey: cacheKey) {
            let response = HTTPURLResponse(
                url: originalURL,
                statusCode: 200,
                httpVersion: "HTTP/1.1",
                headerFields: getCommonHeaders(forImageData: cachedData)
            )!

            urlSchemeTask.didReceive(response)
            urlSchemeTask.didReceive(cachedData)
            urlSchemeTask.didFinish()
            return
        }

        var request = URLRequest(url: originalURL)

        request.httpMethod = urlSchemeTask.request.httpMethod
        request.httpBody = urlSchemeTask.request.httpBody

        // setting headers
        var headers = urlSchemeTask.request.allHTTPHeaderFields ?? [:]
        if let urlComponents = URLComponents(url: originalURL, resolvingAgainstBaseURL: false),
            let scheme = urlComponents.scheme,
            let host = urlComponents.host
        {
            let origin = "\(scheme)://\(host)\(urlComponents.port.map { ":\($0)" } ?? "")"
            headers["Referer"] = origin
            headers["Origin"] = origin
            headers["User-Agent"] =
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

        }
        request.allHTTPHeaderFields = headers

        let taskID = urlSchemeTask.description

        let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            DispatchQueue.main.async {

                guard !self.stoppedTasks.contains(taskID) else { return }

                if let error = error {
                    urlSchemeTask.didFailWithError(error)
                    self.activeTasks.removeValue(forKey: taskID)
                    return
                }

                if let response = response as? HTTPURLResponse, let data = data {
                    guard !self.stoppedTasks.contains(taskID) else { return }

                    // Cache the image data
                    self.imageCache.storeImageData(toDisk: data, forKey: cacheKey)

                    var newHeaders = response.allHeaderFields as? [String: String] ?? [:]

                    for (key, value) in self.getCommonHeaders(forImageData: data) {
                        newHeaders[key] = value
                    }

                    let modifiedResponse = HTTPURLResponse(
                        url: response.url!,
                        statusCode: response.statusCode,
                        httpVersion: "HTTP/1.1",
                        headerFields: newHeaders
                    )!

                    urlSchemeTask.didReceive(modifiedResponse)
                    urlSchemeTask.didReceive(data)
                    urlSchemeTask.didFinish()

                    self.activeTasks.removeValue(forKey: taskID)
                }
            }
        }

        activeTasks[taskID] = task
        task.resume()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {
        let taskID = urlSchemeTask.description
        if let task = activeTasks[taskID] {
            stoppedTasks.insert(taskID)
            task.cancel()
            activeTasks.removeValue(forKey: taskID)
        }
    }
}
