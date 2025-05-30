//
//  AppleIntelligenceGlowEffectModule.swift
//  Pods
//
//  Created by Innei on 2025/2/24.
//

import ExpoModulesCore
import SwiftUI
import UIKit

public class AppleIntelligenceGlowEffectModule: Module {
  private var hostingController: UIHostingController<GlowEffect>?

  public func definition() -> ModuleDefinition {
    Name("AppleIntelligenceGlowEffect")

     
    Function("show") {
      DispatchQueue.main.async { [weak self] in
        guard let rootVC = Utils.getRootVC() else { return }
        let hostingController = UIHostingController(rootView: GlowEffect())
        self?.hostingController = hostingController

        rootVC.addChild(hostingController)
        rootVC.view.addSubview(hostingController.view)
        hostingController.didMove(toParent: rootVC)

        hostingController.view.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
          hostingController.view.topAnchor.constraint(equalTo: rootVC.view.topAnchor),
          hostingController.view.bottomAnchor.constraint(equalTo: rootVC.view.bottomAnchor),
          hostingController.view.leadingAnchor.constraint(equalTo: rootVC.view.leadingAnchor),
          hostingController.view.trailingAnchor.constraint(equalTo: rootVC.view.trailingAnchor),
        ])

        hostingController.view.backgroundColor = .clear
        hostingController.view.isUserInteractionEnabled = false

        hostingController.view.transform = CGAffineTransform(scaleX: 1.1, y: 1.1)
        UIView.animate(withDuration: 0.3, delay: 0, options: .curveEaseOut) {
          hostingController.view.transform = .identity
        }
      }
    }

    Function("hide") {
      DispatchQueue.main.async { [weak self] in
        guard let hostingController = self?.hostingController else { return }

        UIView.animate(
          withDuration: 0.2,
          animations: {
            hostingController.view.alpha = 0
            hostingController.view.transform = CGAffineTransform(scaleX: 1.1, y: 1.1)
          }
        ) { _ in
          hostingController.willMove(toParent: nil)
          hostingController.view.removeFromSuperview()
          hostingController.removeFromParent()
          self?.hostingController = nil
        }
      }
    }
  }
}
