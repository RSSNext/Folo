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
  static let accentColor =
    UIColor(named: "Accent", in: bundle, compatibleWith: nil) ?? UIColor.systemBlue
  
  static func getRootVC() -> UIViewController? {
    if let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
       let window = scene.windows.first,
       let rootVC = window.rootViewController {
      return rootVC
    }
    return nil
  }
}
