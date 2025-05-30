//
//  GaleriaAccessoryModule.swift
//  FollowNative
//
//  Created by Innei on 2025/3/10.
//

import ExpoModulesCore
import SwiftUI

struct EntryGaleriaAccessoryProps: Record {
  @Field var author: String
  @Field var avatarUrl: String?
  @Field var publishedAt: Date = .distantFuture
}

public class GaleriaAccessoryModule: Module {
  // Use NSMapTable to weakly reference VCs and their accessory views
  private static var accessoryViews = NSMapTable<ImageCarouselViewController, UIView>
    .weakToWeakObjects()

  public func definition() -> ModuleDefinition {
    Name("FollowGaleriaAccessory")

    Function("showEntryGaleriaAccessory") { (props: EntryGaleriaAccessoryProps) in
      DispatchQueue.main.async {
        guard let galeriaVC = UIWindow.findViewController(ofType: ImageCarouselViewController.self)
        else {
          return
        }

        // Check if this VC has already added an accessory view
        if GaleriaAccessoryModule.accessoryViews.object(forKey: galeriaVC) != nil {
          return
        }

        let avatarURL = URL(string: props.avatarUrl ?? "")

        let hostingVC = UIHostingController(
          rootView: EntryGaleriaAccessoryView(
            author: props.author, avatarUrl: avatarURL, publishedAt: props.publishedAt))

        if let galeriaView = galeriaVC.view, let window = galeriaView.window {
          hostingVC.view.translatesAutoresizingMaskIntoConstraints = false
          galeriaView.addSubview(hostingVC.view)

          hostingVC.view.backgroundColor = .clear
          hostingVC.view.sizeToFit()
          hostingVC.view.setContentHuggingPriority(.defaultHigh, for: .vertical)
          hostingVC.view.setContentCompressionResistancePriority(.defaultHigh, for: .vertical)

          NSLayoutConstraint.activate([
            hostingVC.view.leadingAnchor.constraint(equalTo: window.leadingAnchor),
            hostingVC.view.trailingAnchor.constraint(equalTo: window.trailingAnchor),
            hostingVC.view.bottomAnchor.constraint(equalTo: window.bottomAnchor),
          ])
          

          // Associate the accessory view with the VC
          GaleriaAccessoryModule.accessoryViews.setObject(hostingVC.view, forKey: galeriaVC)
        }
      }
    }
  }
}
 
