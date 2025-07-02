//
//  AppleIntelligenceGlowEffectModule.swift
//  Pods
//
//  Created by Innei on 2025/2/24.
//

import ExpoModulesCore

public class AppleIntelligenceGlowEffectModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleIntelligenceGlowEffect")

     
    Function("show") {
      DispatchQueue.main.async {
        _ = showIntelligenceEffect()
      }
    }

    Function("hide") {
      DispatchQueue.main.async {
        hideIntelligenceEffect()
      }
    }
  }
}
