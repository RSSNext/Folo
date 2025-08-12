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

class WebViewState: ObservableObject {
  @Published var contentHeight: CGFloat = UIWindow().bounds.height
  @Published var imagePreviewEvent: ImagePreviewEvent?
  @Published var audioSeekEvent: AudioSeekEvent?

  func previewImages(urls: [String], index: Int) {
    imagePreviewEvent = ImagePreviewEvent(imageUrls: urls, index: index)
  }

  func seekAudio(time: Double) {
    audioSeekEvent = AudioSeekEvent(time: time)
  }
}
