//
//  TabScreenModule.swift
//  FollowNative
//
//  Created by Innei on 2025/3/16.
//

import ExpoModulesCore

public class TabScreenModule: Module {

  public func definition() -> ModuleDefinition {
    Name("TabScreen")
    View(TabScreenView.self) {
      Prop("title") { (view, title: String?) in
        view.title = title
      }
      Prop("icon") { (view, icon: String?) in
        view.icon = icon
      }
      Prop("activeIcon") { (view, activeIcon: String?) in
        view.activeIcon = activeIcon
      }
    }
  }
}
