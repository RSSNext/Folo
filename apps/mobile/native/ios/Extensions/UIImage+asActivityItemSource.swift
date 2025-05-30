import CoreGraphics
import LinkPresentation
import UIKit

extension UIImage {
  private final class UIImageActivityItemSource: NSObject, UIActivityItemSource {
    var image = UIImage()
    var title: String?
    var url: URL?

    func activityViewControllerPlaceholderItem(_ activityViewController: UIActivityViewController)
      -> Any
    {
      UIImage()
    }

    func activityViewController(
      _ activityViewController: UIActivityViewController,
      itemForActivityType activityType: UIActivity.ActivityType?
    ) -> Any? {
      image
    }

    func activityViewControllerLinkMetadata(_: UIActivityViewController) -> LPLinkMetadata? {
      let metadata = LPLinkMetadata()

      if let url = url {
        metadata.originalURL = url
        metadata.url = url
      }

      if let title = title {
        metadata.title = title
      }

      // This makes it so that the activity controller shows a thumbnail. It wouldn't if you just pass a plain UIImage to it.
      metadata.imageProvider = NSItemProvider(object: image)

      return metadata
    }
  }

  /**
  Makes the image a source for an `UIActivityViewController`.

  The benefit of using this instead of passing the image directly is that with this one the activity controller shows a thumbnail and you can also set title and URL.
  */
  func asActivityItemSource(
    title: String? = nil,
    url: URL? = nil
  ) -> UIActivityItemSource {
    let itemSource = UIImageActivityItemSource()
    itemSource.image = self
    let pixelWidth = Int(self.size.width * self.scale)
    let pixelHeight = Int(self.size.height * self.scale)

    itemSource.title = title ?? "\(pixelHeight)x\(pixelWidth)"
    itemSource.url = url
    return itemSource
  }
}
