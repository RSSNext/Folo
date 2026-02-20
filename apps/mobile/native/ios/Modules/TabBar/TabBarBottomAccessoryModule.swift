//
//  TabBarBottomAccessoryModule.swift
//  FollowNative
//
//  Created by Innei on 2025-09-25
//

import ExpoModulesCore
import UIKit

public class TabBarBottomAccessoryModule: Module {
  public func definition() -> ModuleDefinition {
    Name("TabBarBottomAccessory")

    View(TabBarBottomAccessoryView.self) {

    }
  }
}

class TabBarBottomAccessoryView: ExpoView {
  private weak var attachedRoot: TabBarRootView?

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  deinit {
    detachFromRoot()
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    attachToNearestTabBarRoot()
  }

  override func willMove(toWindow newWindow: UIWindow?) {
    if newWindow == nil {
      detachFromRoot()
    }
    super.willMove(toWindow: newWindow)
  }

  #if RCT_NEW_ARCH_ENABLED

    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      attachToNearestTabBarRoot()
    }

    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
      detachFromRoot()

    }
  #endif

  func attachToNearestTabBarRoot() {
    if #available(iOS 26, *) {
      guard window != nil else { return }

      CustomTabbarController.tabBarController.bottomAccessory = .init(contentView: self)
    }

  }

  func detachFromRoot() {
    if #available(iOS 26, *) {
      guard window != nil else { return }
      CustomTabbarController.tabBarController.bottomAccessory = nil

    }
  }

}
