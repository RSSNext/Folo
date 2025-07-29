//
//  TabBarModule.swift
//  FollowNative
//
//  Created by Innei on 2025/3/16.
//

import ExpoModulesCore

public class TabBarModule: Module {

    public func definition() -> ModuleDefinition {
        Name("TabBarRoot")

        Function("switchTab") { [weak self] (reactTag: Int, index: Int) in
          DispatchQueue.main.async {
            guard let bridge = self?.appContext?.reactBridge else {
                return
            }

            if let sourceView = bridge.uiManager.view(forReactTag: NSNumber(value: reactTag)) as! TabBarRootView?
               
            {
              sourceView.switchToTab(index: index)
            }
          }
        }

        View(TabBarRootView.self) {
          Prop("selectedIndex") { (view, index: Int) in
            view.switchToTab(index: index)
          }
          
          Events("onTabIndexChange")
        }
    }
}
