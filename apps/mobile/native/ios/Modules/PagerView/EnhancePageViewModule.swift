//
//  EnhancePageViewModule.swift
//  FollowNative
//
//  Created by Innei on 2025/3/31.
//

import ExpoModulesCore

public class EnhancePageViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EnhancePageView")
    
    View(EnhancePageView.self) {
    }
  }
}


class EnhancePageView: ExpoView {
  
}
