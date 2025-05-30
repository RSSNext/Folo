//
//  UIImage.swift
//  FollowNative
//
//  Created by Innei on 2025/3/12.
//

import UIKit

extension UIImage {
    func withAlpha(_ alpha: CGFloat) -> UIImage {
        return UIGraphicsImageRenderer(size: size).image { _ in
            draw(at: .zero, blendMode: .normal, alpha: alpha)
        }
    }
}
