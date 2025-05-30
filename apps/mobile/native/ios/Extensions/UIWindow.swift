//
//  UIWindow.swift
//  FollowNative
//
//  Created by Innei on 2025/2/27.
//

import UIKit

extension UIWindow {

  
  static  func findViewController<T: UIViewController>(ofType type: T.Type) -> T? {
    guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = windowScene.windows.first else {
            return nil
        }
  
    
          if let rootVC = window.rootViewController {
              return findViewControllerInHierarchy(rootVC, ofType: type)
          }
          return nil
      }
      
 
      static private func findViewControllerInHierarchy<T: UIViewController>(_ viewController: UIViewController, ofType type: T.Type) -> T? {
           
          if let targetVC = viewController as? T {
              return targetVC
          }
          
         
          if let navController = viewController as? UINavigationController {
              if let visibleVC = navController.visibleViewController {
                  return findViewControllerInHierarchy(visibleVC, ofType: type)
              }
          }
          
          
          if let tabController = viewController as? UITabBarController {
              if let selectedVC = tabController.selectedViewController {
                  return findViewControllerInHierarchy(selectedVC, ofType: type)
              }
          }
          
          
          for childVC in viewController.children {
              if let foundVC = findViewControllerInHierarchy(childVC, ofType: type) {
                  return foundVC
              }
          }
          
            
          if let presentedVC = viewController.presentedViewController {
              return findViewControllerInHierarchy(presentedVC, ofType: type)
          }
          
          return nil
      }
  
    public static func findRNSNavigationController() -> UINavigationController? {

      guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                let window = windowScene.windows.first else {
              return nil
          }

        let rootViewController = window.rootViewController

        if let navController = rootViewController as? UINavigationController,
            NSStringFromClass(type(of: navController)).contains("RNSNavigationController")
        {
            return navController
        }

        return findRNSNavigationControllerInChildren(of: rootViewController)
    }

    private static func findRNSNavigationControllerInChildren(of viewController: UIViewController?)
        -> UINavigationController?
    {
        guard let viewController = viewController else {
            return nil
        }

        if let presentedVC = viewController.presentedViewController {
            if let navController = presentedVC as? UINavigationController,
                NSStringFromClass(type(of: navController)).contains("RNSNavigationController")
            {
                return navController
            }

            if let result = findRNSNavigationControllerInChildren(of: presentedVC) {
                return result
            }
        }

        for childVC in viewController.children {
            if let navController = childVC as? UINavigationController,
                NSStringFromClass(type(of: navController)).contains("RNSNavigationController")
            {
                return navController
            }

            if let result = findRNSNavigationControllerInChildren(of: childVC) {
                return result
            }
        }

        return nil
    }
}
