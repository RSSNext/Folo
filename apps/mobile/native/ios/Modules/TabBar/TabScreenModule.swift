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
    View(TabScreenView.self) {}
  }
}
