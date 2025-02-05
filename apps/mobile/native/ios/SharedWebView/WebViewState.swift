//
//  WebViewState.swift
//  FollowNative
//
//  Created by Innei on 2025/1/31.
//

import Combine

class WebViewState: ObservableObject {
  @Published var contentHeight: CGFloat = UIWindow().bounds.height
}
