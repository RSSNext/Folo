//
//  Toast.swift
//  FollowNative
//
//  Created by Innei on 2025/4/9.
//

import Foundation
import ToastViewSwift

public enum Toast {
    enum ToastType: String {
        case error
        case info
        case warn
        case success
    }

    enum Position: String {
        case top
        case center
        case bottom
    }

    struct ToastOptions {
        var message: String?
        var type: ToastType = .info
        var duration: Double = 1.5
        var title: String
        var position: Position?
    }

    static func show(options: ToastOptions) {
        DispatchQueue.main.async {
            let config: ToastConfiguration = .init(
                direction: options.position?.position() ?? .top,
                dismissBy: [.time(time: TimeInterval(options.duration))]
            )
            ToastViewSwift.Toast.default(image: options.type.image(), title: options.title, subtitle: options.message, config: config)
                .show(haptic: options.type.haptic())
        }
    }
}

extension Toast.Position {
    func position() -> ToastViewSwift.Toast.Direction {
        switch self {
        case .top:
            return .top
        case .center:
            return .center
        case .bottom:
            return .bottom
        }
    }
}

extension Toast.ToastType {
    func image() -> UIImage {
        switch self {
        case .error: UIImage(systemName: "xmark.circle.fill")!.withTintColor(.systemRed)
        case .warn: UIImage(systemName: "exclamationmark.triangle.fill")!.withTintColor(.systemOrange)
        case .info: UIImage(systemName: "info.circle.fill")!.withTintColor(.systemBlue)
        case .success: UIImage(systemName: "checkmark.circle.fill")!.withTintColor(.systemGreen)
        }
    }

    func haptic() -> UINotificationFeedbackGenerator.FeedbackType {
        switch self {
        case .error: .error
        case .info: .success
        case .warn: .warning
        case .success: .success
        }
    }
}
