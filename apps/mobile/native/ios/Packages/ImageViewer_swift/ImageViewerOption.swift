import UIKit

public enum ImageViewerOption {

    case contentMode(UIView.ContentMode)
    case onPreview((Int) -> Void)
    case onClosePreview(() -> Void)
    case onIndexChange((Int) -> Void)
}
