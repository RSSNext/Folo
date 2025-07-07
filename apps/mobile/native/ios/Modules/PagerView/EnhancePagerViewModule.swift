//
//  EnhancePagerModule.swift
//  FollowNative
//
//  Created by Innei on 2025/3/30.
//

import ExpoModulesCore

public class EnhancePagerViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EnhancePagerView")

    View(EnhancePagerView.self) {
      OnViewDidUpdateProps { view in
        view.initialize()
      }

      Prop("page") { (view: EnhancePagerView, index: Int) in
        view.page = index
      }

      Prop("initialPageIndex") { (view: EnhancePagerView, index: Int) in
        view.initialPageIndex = index
      }

      Prop("transitionStyle") { (view: EnhancePagerView, style: TransitionStyle?) in
        guard let style = style else { return }
        view.transitionStyle = style
      }

      AsyncFunction("setPage") { (view: EnhancePagerView, index: Int) in
        view.pageController?.setCurrentPage(index: index)
      }

      AsyncFunction("getCurrentPage") { view in
        view.pageController?.getCurrentPageIndex()
      }

      AsyncFunction("getState") { view -> String? in
        if let pageController = view.pageController {
          return pageController.getState().rawValue
        }
        return nil
      }

      Events("onPageChange")
      Events("onScroll")
      Events("onScrollBegin")
      Events("onScrollEnd")
      Events("onPageWillAppear")
    }
  }
}

enum TransitionStyle: String, Enumerable {
  case scroll
  case pageCurl
  func toUIPageViewControllerTransitionStyle() -> UIPageViewController.TransitionStyle {
    switch self {
    case .scroll:
      return .scroll
    case .pageCurl:
      return .pageCurl
    }
  }
}

private class EnhancePagerView: ExpoView, UIGestureRecognizerDelegate {
  fileprivate var pageController: EnhancePagerController?

  private let onScroll = EventDispatcher()
  private let onScrollBegin = EventDispatcher()
  private let onScrollEnd = EventDispatcher()
  private let onPageChange = EventDispatcher()
  private let onPageWillAppear = EventDispatcher()

  private var pageViews: [UIView] = []

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  override func insertSubview(_ view: UIView, at index: Int) {
    pageViews.insert(view, at: index)
    pageController?.insertPageView(view: view)
  }

  func willRemoveSubview(_ subview: UIView, at index: Int) {
    pageViews.remove(at: index)
    pageController?.removePageView(at: index)
  }

  // Props
  var page: Int = 0 {
    willSet {
      pageController?.setCurrentPage(index: newValue)
    }
  }

  var initialPageIndex: Int = 0

  var pageGap = 20
  var transitionStyle: TransitionStyle = .scroll
  var panGestureRecognizer: UIGestureRecognizer?
  func initialize() {
    let panGestureRecognizer = UIPanGestureRecognizer()
    panGestureRecognizer.delegate = self
    self.panGestureRecognizer = panGestureRecognizer
    addGestureRecognizer(panGestureRecognizer)

    pageController = EnhancePagerController(
      pageViews: pageViews, initialPageIndex: initialPageIndex,
      transitionStyle: transitionStyle.toUIPageViewControllerTransitionStyle(),
      options: [
        .interPageSpacing: pageGap
      ])
    guard let pageController = pageController else { return }
    addSubview(pageController.view)
    pageController.view.snp.makeConstraints { make in
      make.edges.equalToSuperview()
    }

    pageController.onPageIndexChange = { [weak self] index in
      self?.onPageChange(["index": index])
    }
    pageController.onScrollStart = { [weak self] index in
      self?.onScrollBegin(["index": index])
    }
    pageController.onScroll = { [weak self] percent, direction, position in
      self?.onScroll(["percent": percent, "direction": direction.rawValue, "position": position])
    }
    pageController.onScrollEnd = { [weak self] index in
      self?.onScrollEnd(["index": index])
    }
    pageController.onPageWillAppear = { [weak self] index in
      self?.onPageWillAppear(["index": index])
    }
  }

  #if RCT_NEW_ARCH_ENABLED
    override func mountChildComponentView(_ childComponentView: UIView, index: Int) {
      if childComponentView is EnhancePageView {
        insertSubview(childComponentView, at: index)
      }
    }

    override func unmountChildComponentView(_ childComponentView: UIView, index: Int) {
      if childComponentView is EnhancePageView {
        willRemoveSubview(childComponentView, at: index)
      }
    }
  #endif

  func gestureRecognizer(
    _ gestureRecognizer: UIGestureRecognizer,
    shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer
  ) -> Bool {
    guard let pageController = pageController else { return false }
    let currentIndex = pageController.getCurrentPageIndex()
    guard let scrollView = pageController.scrollView else { return false }
    if gestureRecognizer == panGestureRecognizer,
       NSStringFromClass(type(of: otherGestureRecognizer)) == "RNSPanGestureRecognizer"
    {
      if let panGestureRecognizer = gestureRecognizer as? UIPanGestureRecognizer {
        let velocity = panGestureRecognizer.velocity(in: self)
        let isLTR = true
        let isBackGesture = (isLTR && velocity.x > 0) || (!isLTR && velocity.x < 0)

        if currentIndex == 0 && isBackGesture {
          scrollView.panGestureRecognizer.isEnabled = false
        }
      }
      return true
    }

    return false
  }
}
