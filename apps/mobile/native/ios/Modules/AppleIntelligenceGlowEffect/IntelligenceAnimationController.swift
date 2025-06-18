import Foundation
import SwiftUI
import UIKit

/// A private class to manage the presentation of the animation in a separate window.
private class IntelligenceAnimationPresenter {
  static let shared = IntelligenceAnimationPresenter()
  private var window: UIWindow?

  private init() {}

  func show() -> () -> Void {
    guard self.window == nil else {
      // If window already exists, just return a closure to hide it.
      return { self.hide() }
    }

    // Find the active window scene to display the new window.
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
      print("Could not find a UIWindowScene.")
      return {}
    }

    let animationView = IntelligenceAnimationView()
    // Use UIHostingController to embed the SwiftUI view.
    let hostingController = UIHostingController(rootView: animationView)
    hostingController.view.backgroundColor = .clear

    // Create and configure the new window.
    let newWindow = UIWindow(windowScene: windowScene)
    newWindow.rootViewController = hostingController
    // Set a high window level to appear on top.
    newWindow.windowLevel = .normal + 1
    newWindow.backgroundColor = .clear
    newWindow.isUserInteractionEnabled = false  // Let touches pass through.
    newWindow.makeKeyAndVisible()

    // Animate the appearance
    newWindow.alpha = 0
    UIView.animate(withDuration: 0.5) {
      newWindow.alpha = 1
    }

    self.window = newWindow

    return { self.hide() }
  }

  func hide() {
    guard let window = self.window else { return }

    UIView.animate(
      withDuration: 0.5,
      animations: {
        window.alpha = 0
      }
    ) { _ in
      // Clean up the window after the animation.
      window.isHidden = true
      self.window = nil
    }
  }
}

// MARK: - Public API

@MainActor
@discardableResult
public func showIntelligenceEffect() -> () -> Void {
  return IntelligenceAnimationPresenter.shared.show()
}

@MainActor
public func hideIntelligenceEffect() {
  IntelligenceAnimationPresenter.shared.hide()
}
