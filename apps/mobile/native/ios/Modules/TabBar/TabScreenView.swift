//
//  TabScreenView.swift
//  FollowNative
//
//  Created by Innei on 2025/3/16.
//

import ExpoModulesCore
import UIKit

class TabScreenView: ExpoView {
  weak var ownerViewController: UIViewController?

  var icon: String?
  var activeIcon: String?
  var title: String? {
    didSet {
      // The tab bar item copies the title once, when the tab is inserted, so a later title, e.g.
      // after a language switch, has to be passed on here
      ownerViewController?.tabBarItem.title = title
    }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

}
