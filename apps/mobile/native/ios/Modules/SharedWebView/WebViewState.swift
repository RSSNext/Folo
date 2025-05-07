//
//  WebViewState.swift
//  FollowNative
//
//  Created by Innei on 2025/1/31.
//

import Combine
import UIKit

class WebViewState: ObservableObject {
  @Published var contentHeight: CGFloat = UIWindow().bounds.height
}
