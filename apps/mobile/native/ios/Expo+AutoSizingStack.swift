// https://github.com/expo/expo/blob/main/packages/expo-modules-core/ios/Core/Views/SwiftUI/AutoSizingStack.swift#L18
import SwiftUI
import ExpoModulesCore
extension ExpoSwiftUI {
  public struct AxisSet: OptionSet {
    public init(rawValue: Int) {
      self.rawValue = rawValue
    }
    public let rawValue: Int

    public static let horizontal = AxisSet(rawValue: 1 << 0)
    public static let vertical = AxisSet(rawValue: 1 << 1)

    public static let both: AxisSet = [.horizontal, .vertical]
  }

  public struct AutoSizingStack<Content: SwiftUI.View>: SwiftUI.View {
    let content: Content
    let proxy: ShadowNodeProxy
    let axis: AxisSet

    public init(shadowNodeProxy: ShadowNodeProxy, axis: AxisSet = .both, @ViewBuilder _ content: () -> Content) {
      self.proxy = shadowNodeProxy
      self.content = content()
      self.axis = axis
    }

    public var body: some SwiftUI.View {
      if #available(iOS 16.0, tvOS 16.0, *) {
        content.fixedSize(horizontal: axis.contains(.horizontal), vertical: axis.contains(.vertical))
        .onGeometryChange(for: CGSize.self) { proxy in
          proxy.size
        } action: {
          let width = axis.contains(.horizontal) ? $0.width : ShadowNodeProxy.UNDEFINED_SIZE
          let height = axis.contains(.vertical) ? $0.height : ShadowNodeProxy.UNDEFINED_SIZE
          let size = CGSize(width: width, height: height)
          proxy.setViewSize?(size)
        }
      } else {
        // TODO: throw a warning
        content.onAppear(perform: {
          log.warn("AutoSizingStack is not supported on iOS/tvOS < 16.0")
        })
      }
    }
  }
}

extension ExpoSwiftUI {
  open class ShadowNodeProxy: ObservableObject, Record {
    public required init() {}

    // We use Double.nan to mark a dimension as unset. This value is passed to https://github.com/facebook/yoga/blob/49ee855f99fb67079c24d507a4ea1b6d80fa2ebf/yoga/style/StyleLength.h#L33
    static let UNDEFINED_SIZE = Double.nan

    public var setViewSize: ((CGSize) -> Void)?
  }
}
