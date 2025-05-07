//
//  GaleriaModule.swift
//  Pods
//  Copy from https://github.dev/nandorojo/galeria
//  Created by Innei on 2025/3/10.
//

import ExpoModulesCore
import SwiftUI
import UIKit

public class GaleriaModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FollowGaleria")

    View(GaleriaView.self) {
      Events("onPreview")
      Events("onClosePreview")
      Events("onChangeIndex")

      Prop("urls") { (view, urls: [String]?) in
        view.urls = urls
      }

      Prop("index") { (view, index: Int?) in
        view.initialIndex = index
      }
      Prop("rightNavItemIconName") { (view, rightNavItemIconName: String) in
        view.rightNavItemIconName = rightNavItemIconName
      }
    }
  }
}
