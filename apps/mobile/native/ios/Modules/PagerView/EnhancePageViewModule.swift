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
    var isScrolling: Bool = false
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
      debugPrint("hitTest",isScrolling)
        if isScrolling {
            return nil
        }
        let hitView = super.hitTest(point, with: event)
        if hitView == self {
            return nil
        }
        return hitView
    }
}
