//
//  WebViewState.swift
//  FollowNative
//
//  Created by Innei on 2025/1/31.
//

import Combine
import UIKit

struct ImagePreviewEvent {
  let imageUrls: [String]
  let index: Int
}

struct AudioSeekEvent {
  let time: Double
}

final class WebViewState: ObservableObject {
  @Published public var contentHeight: CGFloat
  @Published public var imagePreviewEvent: ImagePreviewEvent?
  @Published public var audioSeekEvent: AudioSeekEvent?

  public init() {
    self.contentHeight = UIScreen.main.bounds.height
  }

  public func previewImages(urls: [String], index: Int) {
    imagePreviewEvent = ImagePreviewEvent(imageUrls: urls, index: index)
  }

  public func seekAudio(time: Double) {
    audioSeekEvent = AudioSeekEvent(time: time)
  }
}
