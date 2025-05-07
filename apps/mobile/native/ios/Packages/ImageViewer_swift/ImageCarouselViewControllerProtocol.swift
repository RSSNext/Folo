//
//  ImageCarouselViewControllerProtocol.swift
//  FollowNative
//
//  Created by Innei on 2025/3/12.
//

import UIKit

protocol ImageCarouselViewControllerProtocol {
  func saveImageToPhotos()
  func copyImageToClipboard()
  func shareImage()

  func isLoadError() -> Bool
}
