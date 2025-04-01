//
//  Utils.swift
//  FollowNative
//
//  Created by Innei on 2025/2/7.
//

import Foundation
import UIKit

private class Noop {}

enum Utils {
    static let bundle = Bundle(for: Noop.self)
    static let accentColor = UIColor(cgColor: .init(red: 255 / 255, green: 92 / 255, blue: 0, alpha: 1))

    static func getRootVC() -> UIViewController? {
        if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = scene.windows.first,
           let rootVC = window.rootViewController {
            return rootVC
        }
        return nil
    }

    static func findUIViewOfType<T: UIView>(view: UIView?) -> T? {
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
