//
//  GaleriaView.swift
//  Copy from https://github.dev/nandorojo/galeria
//
//  Created by Innei on 2025/3/10.
//

import ExpoModulesCore
import UIKit

class GaleriaView: ExpoView {

  override required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

 
  func getChildImageView() -> UIImageView? {
    var reactSubviews: [UIView]? = nil
    if RCTIsNewArchEnabled() {
      reactSubviews = self.subviews
    } else {
      reactSubviews = self.reactSubviews()
    }

    guard let reactSubviews else { return nil }

    for reactSubview in reactSubviews {
      for subview in reactSubview.subviews {
        if let imageView = subview as? UIImageView {
          return imageView
        }
      }
    }

    return nil
  }

  override func insertReactSubview(_ subview: UIView!, at atIndex: Int) {
    super.insertReactSubview(subview, at: atIndex)
    if !RCTIsNewArchEnabled() {
      setupImageView()
    }
  }

  override func insertSubview(_ subview: UIView, at atIndex: Int) {
    super.insertSubview(subview, at: atIndex)
    if RCTIsNewArchEnabled() {
      setupImageView()
    }
  }

  var urls: [String]? { didSet { setupImageView() } }
  var initialIndex: Int? { didSet { setupImageView() } }
  var closeIconName: String?
  var rightNavItemIconName: String?
  let onPressRightNavItemIcon = EventDispatcher()
  let onPreview = EventDispatcher()
  let onClosePreview = EventDispatcher()
  let onIndexChange = EventDispatcher()

  func setupImageView() {

    guard let childImage = getChildImageView() else {
      return
    }

    if let urls = self.urls, let initialIndex = self.initialIndex {
      setupImageViewerWithUrls(
        childImage, urls: urls, initialIndex: initialIndex)
    } else {
      setupImageViewerWithSingleImage(childImage)
    }
  }

  private func setupImageViewerWithUrls(
    _ childImage: UIImageView, urls: [String], initialIndex: Int
  ) {
    let urlObjects = urls.compactMap(URL.init(string:))
    let options = buildImageViewerOptions()

    childImage.setupImageViewer(urls: urlObjects, initialIndex: initialIndex, options: options)
  }

  private func setupImageViewerWithSingleImage(
    _ childImage: UIImageView
  ) {
    guard let img = childImage.image else {
      print("Missing image in childImage: \(childImage)")
      return
    }
    let options = buildImageViewerOptions()

    childImage.setupImageViewer(images: [img], options: options)
  }

  private func buildImageViewerOptions() -> [ImageViewerOption] {

    var options: [ImageViewerOption] = []
    let iconColor: UIColor = .white

    options.append(
      ImageViewerOption.onPreview { [weak self] index in
        self?.onPreview(["index": index])
      })

    options.append(
      ImageViewerOption.onClosePreview { [weak self] in
        self?.onClosePreview()
      })

    options.append(
      ImageViewerOption.onIndexChange { [weak self] index in
        self?.onIndexChange(["index": index])
      })
    return options
  }
}
