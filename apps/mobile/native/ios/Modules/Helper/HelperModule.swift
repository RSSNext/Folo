//
//  HelperModule.swift
//  Pods
//
//  Created by Innei on 2025/2/7.
//
import ExpoModulesCore
import UIKit

public class HelperModule: Module {
    public func definition() -> ExpoModulesCore.ModuleDefinition {
        Name("Helper")

        AsyncFunction("openLink") { (urlString: String, promise: Promise) in
            guard let url = URL(string: urlString) else {
                return
            }
            DispatchQueue.main.async {
                guard let rootVC = Utils.getRootVC() else { return }

                let onDismiss = {
                    promise.resolve(["type": "dismiss"])
                }

                WebViewManager.presentModalWebView(url: url, from: rootVC, onDismiss: onDismiss)
            }
        }

        Function("scrollToTop") { (reactTag: Int) in
            DispatchQueue.main.async { [weak self] in
                guard let bridge = self?.appContext?.reactBridge else { return }

                if let sourceView = bridge.uiManager.view(forReactTag: NSNumber(value: reactTag)) {
                    let scrollView = self?.findUIScrollView(view: sourceView)
                    guard let scrollView = scrollView else {
                        return
                    }
                    scrollView.scrollToTopIfPossible(animated: true)
                }
            }
        }

        AsyncFunction("isScrollToEnd") { (reactTag: Int, promise: Promise) in
            DispatchQueue.main.async { [weak self] in
                guard let bridge = self?.appContext?.reactBridge else { return }

                if let sourceView = bridge.uiManager.view(forReactTag: NSNumber(value: reactTag)) {
                    let scrollView = self?.findUIScrollView(view: sourceView)
                    guard let scrollView = scrollView else {
                        return
                    }
                    let contentHeight = scrollView.contentSize.height
                    let scrollViewHeight = scrollView.bounds.size.height
                    let contentOffsetY = scrollView.contentOffset.y

                    let bottomOffset = contentHeight - scrollViewHeight

                    promise.resolve(contentOffsetY >= bottomOffset - 1.0)
                }
            }
        }

        Function("saveImageByHandle") { (reactTag: Int) in
            DispatchQueue.main.async { [weak self] in
                guard let bridge = self?.appContext?.reactBridge else { return }

                if let sourceView = bridge.uiManager.view(forReactTag: NSNumber(value: reactTag)) {
                    let imageView = self?.findUIImageView(view: sourceView)
                    guard let imageView = imageView else {
                        return
                    }
                    guard let image = imageView.image else { return }
                    UIImageWriteToSavedPhotosAlbum(image, self, #selector(HelperModule.image), nil)
                    Toast.show(options: .init(type: .success, title: "Saved to photos"))
                }
            }
        }

        Function("shareImageByHandle") { (reactTag: Int, url: String?) in
            DispatchQueue.main.async { [weak self] in
                guard let bridge = self?.appContext?.reactBridge else { return }
                if let sourceView = bridge.uiManager.view(forReactTag: NSNumber(value: reactTag)) {
                    let imageView = self?.findUIImageView(view: sourceView)
                    guard let imageView = imageView else {
                        return
                    }
                    guard let image = imageView.image else { return }
                    let activityViewController = UIActivityViewController(
                        activityItems: [
                            image.asActivityItemSource(
                                url: try? URL(string: url ?? "")
                            ),
                        ], applicationActivities: nil)
                    activityViewController.popoverPresentationController?.sourceView = sourceView
                    activityViewController.popoverPresentationController?.sourceRect = sourceView.bounds
                    activityViewController.popoverPresentationController?.permittedArrowDirections = .any
                    activityViewController.popoverPresentationController?.permittedArrowDirections = .any

                    Utils.getRootVC()?.present(activityViewController, animated: true)
                }
            }
        }

        AsyncFunction("getBase64FromImageViewByHandle") { (reactTag: Int, promise: Promise) in
            DispatchQueue.main.async { [weak self] in
                guard let bridge = self?.appContext?.reactBridge else { return }

                if let sourceView = bridge.uiManager.view(forReactTag: NSNumber(value: reactTag)) {
                    let imageView = self?.findUIImageView(view: sourceView)
                    guard let imageView = imageView else {
                        promise.reject(
                            NSError(
                                domain: "HelperModule", code: 0,
                                userInfo: [NSLocalizedDescriptionKey: "Image view not found"]))
                        return
                    }
                    let base64 = self?.getBase64FromImageView(imageView: imageView)
                    promise.resolve(["base64": base64])
                }
            }
        }

        Function("copyImageByHandle") { (reactTag: Int) in
            DispatchQueue.main.async { [weak self] in
                guard let bridge = self?.appContext?.reactBridge else { return }

                if let sourceView = bridge.uiManager.view(forReactTag: NSNumber(value: reactTag)) {
                    let imageView = self?.findUIImageView(view: sourceView)
                    guard let imageView = imageView else {
                        return
                    }
                    guard let image = imageView.image else { return }
                    guard let imageData = image.pngData() else { return }
                    UIPasteboard.general.setData(imageData, forPasteboardType: "public.png")

                    Toast.show(options: .init(type: .success, title: "Image copied to clipboard"))
                }
            }
        }
    }

    func getBase64FromImageView(imageView: UIImageView) -> String? {
        guard let image = imageView.image else { return nil }
        guard let imageData = image.pngData() else { return nil }

        let base64String = imageData.base64EncodedString(options: .lineLength64Characters)
        return base64String
    }

    @objc func image(
        _ image: UIImage, didFinishSavingWithError error: Error?, contextInfo: UnsafeRawPointer?
    ) {
        if let error = error {
            Toast.show(options: .init(type: .error, title: "Save image failed"))
        } else {
            Toast.show(options: .init(type: .success, title: "Saved to photos"))
        }
    }

    private func findUIScrollView(view: UIView?) -> UIScrollView? {
        return findUIViewOfType(view: view)
    }

    private func findUIImageView(view: UIView?) -> UIImageView? {
        return findUIViewOfType(view: view)
    }

    private func findUIViewOfType<T: UIView>(view: UIView?) -> T? {
        guard let view = view else {
            return nil
        }
        if let view = view as? T {
            return view
        }

        let subviews = view.subviews
        for subview in subviews {
            if let targetView = findUIViewOfType(view: subview) as T? {
                return targetView
            }
        }
        return nil
    }
}

extension UIScrollView {
    func scrollToTopIfPossible(animated: Bool) {
        let encodedSelector = "X3Njcm9sbFRvVG9wSWZQb3NzaWJsZTo=" // "_scrollToTopIfPossible:"

        if let decodedData = Data(base64Encoded: encodedSelector),
           let decodedString = String(data: decodedData, encoding: .utf8) {
            let selector = NSSelectorFromString(decodedString)
            if responds(to: selector) {
                perform(selector, with: animated)
            } else {
                print("UIScrollView does not respond to decoded method")
                setContentOffset(.zero, animated: animated)
            }
        } else {
            setContentOffset(.zero, animated: animated)
        }
    }
}
