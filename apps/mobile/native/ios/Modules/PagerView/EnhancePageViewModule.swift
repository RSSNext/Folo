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

class EnhancePageView: ExpoView, UIGestureRecognizerDelegate {
    var isScrolling: Bool = false
  
   
 
  
    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {

    return false
  
  }
  
  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive press: UIPress) -> Bool {
    return false
  }
  
  func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
    return false
  }
  
    override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
      
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
