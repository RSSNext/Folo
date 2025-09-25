//
//  TabBarRootView.swift
//  FollowNative
//
//  Created by Innei on 2025/3/16.
//

import ExpoModulesCore
import Foundation
import SnapKit
import UIKit

class TabBarRootView: ExpoView {
  private lazy var tabBarController = {
    let tabBarController = UITabBarController()
    if #available(iOS 16.0, *), UIDevice.current.userInterfaceIdiom == .pad {
      tabBarController.tabBar.isTranslucent = false
      tabBarController.tabBar.barStyle = .default

    }

    tabBarController.tabBar.isHidden = true
    if #available(iOS 18.0, *) {
      tabBarController.isTabBarHidden = true
    }

    if #available(iOS 26.0, *) {
      tabBarController.isTabBarHidden = false
      tabBarController.tabBarMinimizeBehavior = .onScrollDown
    }

    tabBarController.tabBar.tintColor = Utils.accentColor

    return tabBarController
  }()

  private let vc = UIViewController()
  private var tabViewControllers: [UIViewController] = []

  private let onTabIndexChange = EventDispatcher()
  private let onTabItemPress = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)

    tabBarController.delegate = self
    addSubview(vc.view)
    vc.addChild(tabBarController)
    vc.view!.snp.makeConstraints { make in
      make.edges.equalToSuperview()
    }
    vc.view.addSubview(tabBarController.view)
    tabBarController.didMove(toParent: vc)
  }

  #if RCT_NEW_ARCH_ENABLED

    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      insertSubview(childComponentView, at: index)
    }

    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
      willRemoveSubview(childComponentView)
      //      gestureRecognizers?.removeAll()
    }
  #endif

  public func switchToTab(index: Int) {
    let beforeIndex = tabBarController.selectedIndex
    if beforeIndex == index {
      return
    }

    if tabViewControllers.count < beforeIndex || tabViewControllers.count < index {
      return
    }
    if let fromView = tabViewControllers[beforeIndex].view,
      let toView = tabViewControllers[index].view
    {
      if fromView != toView {
        UIView.transition(
          from: fromView,
          to: toView,
          duration: 0.1,
          options: [.transitionCrossDissolve, .preferredFramesPerSecond60],
          completion: nil
        )
      }
    }

    tabBarController.selectedIndex = index
    if let selectedViewController = tabBarController.selectedViewController {
      tabBarController(tabBarController, didSelect: selectedViewController)
    }
  }

  override func insertSubview(_ subview: UIView, at atIndex: Int) {
    if let tabScreenView = subview as? TabScreenView {
      let screenVC = UIViewController()
      screenVC.view = tabScreenView
      tabScreenView.ownerViewController = screenVC
      // Apply current title if already provided from React side
      if let currentTitle = tabScreenView.title {
        screenVC.tabBarItem.title = currentTitle
      }
      if let icon = tabScreenView.icon {
        screenVC.tabBarItem.image = .init(UIImage(named: icon)!)
      }
      if let activeIcon = tabScreenView.activeIcon {
        screenVC.tabBarItem.selectedImage = .init(UIImage(named: activeIcon)!)
      }
      tabViewControllers.append(screenVC)
      tabBarController.viewControllers = tabViewControllers
      tabBarController.didMove(toParent: vc)
    }

    if let tabBarPortalView = subview as? TabBarPortalView {
      let tabBarView = tabBarController.view!
      tabBarView.addSubview(tabBarPortalView)
    }
  }

  override func willRemoveSubview(_ subview: UIView) {
    if let tabScreenView = subview as? TabScreenView {
      tabViewControllers.removeAll { viewController in
        viewController.view == tabScreenView
      }

      tabBarController.viewControllers = tabViewControllers
      tabBarController.didMove(toParent: vc)
    }
  }
}

// MARK: - UITabBarControllerDelegate

extension TabBarRootView: UITabBarControllerDelegate {
  func tabBarController(
    _ tabBarController: UITabBarController, shouldSelect viewController: UIViewController
  ) -> Bool {
    if let index = tabViewControllers.firstIndex(of: viewController) {
      onTabItemPress(["index": index, "currentIndex": tabBarController.selectedIndex])
    }
    return true
  }
  func tabBarController(
    _ tabBarController: UITabBarController, didSelect viewController: UIViewController
  ) {
    onTabIndexChange([
      "index": tabBarController.selectedIndex
    ])
  }

  // func tabBarController(
  //   _ tabBarController: UITabBarController,
  //   animationControllerForTransitionFrom fromVC: UIViewController, to toVC: UIViewController
  // ) -> (any UIViewControllerAnimatedTransitioning)? {

  //   return nil
  // }
}
