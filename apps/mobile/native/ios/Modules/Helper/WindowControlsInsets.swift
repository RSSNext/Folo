//
//  WindowControlsInsets.swift
//  FollowNative
//

import UIKit

/// How far the window controls of iPadOS 26 and later (close, minimize and arrange, in the top
/// leading corner of a window that does not fill the screen) reach into the window past its safe
/// area. UIKit bars move their items clear of them by themselves; the React Native headers only
/// get the safe area, so they add these insets to it.
final class WindowControlsInsetsObserver {
  static let shared = WindowControlsInsetsObserver()

  struct Insets: Equatable {
    var left: CGFloat = 0
    var right: CGFloat = 0

    /// For JavaScript, in points
    var dictionary: [String: Double] {
      ["left": Double(left), "right": Double(right)]
    }
  }

  /// Called on the main thread whenever the insets change
  var onChange: ((Insets) -> Void)?
  private(set) var insets = Insets()
  private weak var probe: WindowControlsProbeView?

  /// The insets of the app window now. Main thread only.
  func currentInsets() -> Insets {
    installProbeIfNeeded()
    if let probe {
      update(probe.measure())
    }
    return insets
  }

  /// Watches the app window, whose resizes and safe area changes report new insets. Main thread only.
  func installProbeIfNeeded() {
    if let probe, probe.window != nil {
      return
    }
    guard let window = Self.appWindow() else {
      return
    }
    let probe = WindowControlsProbeView(frame: window.bounds)
    probe.onMeasure = { [weak self] insets in
      self?.update(insets)
    }
    // Behind everything else in the window: it draws nothing and takes no touches
    window.insertSubview(probe, at: 0)
    self.probe = probe
  }

  private func update(_ next: Insets) {
    guard next != insets else {
      return
    }
    insets = next
    onChange?(next)
  }

  private static func appWindow() -> UIWindow? {
    let windows = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .filter { $0.rootViewController != nil }
    return windows.first(where: \.isKeyWindow) ?? windows.first
  }
}

/// Covers the whole window, so its corner-adapted safe area is the window's
private final class WindowControlsProbeView: UIView {
  var onMeasure: ((WindowControlsInsetsObserver.Insets) -> Void)?

  override init(frame: CGRect) {
    super.init(frame: frame)
    autoresizingMask = [.flexibleWidth, .flexibleHeight]
    backgroundColor = .clear
    isUserInteractionEnabled = false
    isAccessibilityElement = false
    accessibilityElementsHidden = true
  }

  @available(*, unavailable)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    onMeasure?(measure())
  }

  override func safeAreaInsetsDidChange() {
    super.safeAreaInsetsDidChange()
    onMeasure?(measure())
  }

  func measure() -> WindowControlsInsetsObserver.Insets {
    guard #available(iOS 26.0, *) else {
      return .init()
    }
    // The safe area adapted horizontally to the window controls, against the plain safe area
    let adapted = edgeInsets(for: .safeArea(cornerAdaptation: .horizontal))
    return .init(
      left: max(0, adapted.left - safeAreaInsets.left),
      right: max(0, adapted.right - safeAreaInsets.right)
    )
  }
}
