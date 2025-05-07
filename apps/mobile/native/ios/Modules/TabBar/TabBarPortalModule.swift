//
//  TabBarPortalModule.swift
//  FollowNative
//
//  Created by Innei on 2025/3/17.
//

import ExpoModulesCore
import UIKit

public class TabBarPortalModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TabBarPortal")

    View(TabBarPortalView.self) {}
  }
}

class TabBarPortalView: ExpoView {

}
