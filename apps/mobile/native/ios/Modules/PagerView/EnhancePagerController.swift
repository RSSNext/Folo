//
//  PagerView.swift
//  FollowNative
//
//  Created by Innei on 2025/3/30.
//

import SnapKit
import UIKit

enum PagerDirection: String {
  case left
  case right
  case none
}

enum PagerState: String {
  case idle
  case dragging
  case scrolling
}

private class PagerViewController: UIViewController {
  private var pageIndex = 0
  private var pageView: UIView?
  private var contentView: UIView?

  convenience init(index: Int, view: UIView) {
    self.init()
    pageIndex = index
    contentView = view
  }

  override func loadView() {
    pageView = UIView()
    view = pageView
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    if let contentView = contentView, let pageView = pageView {
      contentView.removeFromSuperview() // Ensure it's not in another view hierarchy
      pageView.addSubview(contentView)
      contentView.snp.makeConstraints { make in
        make.edges.equalToSuperview()
      }
    }
  }

  public func getPageIndex() -> Int { pageIndex }
  public func setPageIndex(index: Int) { pageIndex = index }
}

class EnhancePagerController: UIPageViewController, UIScrollViewDelegate {
  private var pageControllers = [PagerViewController]()
  private var currentPageIndex: Int = 0 {
    willSet {
      if newValue != currentPageIndex {
        onPageIndexChange?(newValue)
      }
    }
  }

  // Events
  var onPageIndexChange: ((Int) -> Void)?
  var onScroll: ((CGFloat, PagerDirection, Int) -> Void)?
  var onScrollEnd: ((Int) -> Void)?
  var onScrollStart: ((Int) -> Void)?
  var onPageWillAppear: ((Int) -> Void)?

  var isTransitioning: Bool = false
  var isDragging: Bool = false

  public var scrollView: UIScrollView?

  convenience init(
    pageViews: [UIView], initialPageIndex: Int = 0,
    transitionStyle: UIPageViewController.TransitionStyle = .scroll,
    options: [UIPageViewController.OptionsKey: Any]? = nil
  ) {
    self.init(
      transitionStyle: transitionStyle, navigationOrientation: .horizontal, options: options)
    pageControllers = pageViews.enumerated().map { index, view in
      PagerViewController(index: index, view: view)
    }
    currentPageIndex = initialPageIndex
  }

  override func viewDidLoad() {
    super.viewDidLoad()
    dataSource = self
    delegate = self

    let hasPageController = pageControllers.indices.contains(currentPageIndex)

    if hasPageController {
      let vc = pageControllers[currentPageIndex]
      setViewControllers([vc], direction: .forward, animated: false)
      vc.didMove(toParent: self)
    } else {
      setViewControllers([UIViewController()], direction: .forward, animated: false)
    }

    for subview in view.subviews {
      if let scrollView = subview as? UIScrollView {
        scrollView.delegate = self
        scrollView.delaysContentTouches = false
        self.scrollView = scrollView
      }
    }
  }

  var startOffset: CGFloat = 0

  func scrollViewWillBeginDragging(_ scrollView: UIScrollView) {
    startOffset = scrollView.contentOffset.x
    debugPrint(scrollView.contentOffset.x)
    isDragging = true
    onScrollStart?(currentPageIndex)
  }

  public func scrollViewDidScroll(_ scrollView: UIScrollView) {
    var direction: PagerDirection = .none

    if startOffset < scrollView.contentOffset.x {
      direction = .right
    } else if startOffset > scrollView.contentOffset.x {
      direction = .left
    }

    let positionFromStartOfCurrentPage = abs(startOffset - scrollView.contentOffset.x)
    let percent = positionFromStartOfCurrentPage / view.frame.width
    let position = currentPageIndex

    debugPrint(percent, direction, position)
    onScroll?(percent, direction, position)
  }

  public func scrollViewDidEndDragging(
    _ scrollView: UIScrollView, willDecelerate decelerate: Bool
  ) {
    if !decelerate {
      isDragging = false
      onScrollEnd?(currentPageIndex)
    }
  }

  public func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
    isDragging = false
    onScrollEnd?(currentPageIndex)
  }
}

// Add this extension to implement UIPageViewControllerDataSource
extension EnhancePagerController: UIPageViewControllerDataSource, UIPageViewControllerDelegate {
  func pageViewController(
    _ pageViewController: UIPageViewController,
    viewControllerBefore viewController: UIViewController
  ) -> UIViewController? {
    if let pagerController = pageViewController.viewControllers?.first as? PagerViewController {
      let index = pagerController.getPageIndex()
      if index > 0 {
        onPageWillAppear?(index - 1)
        return pageControllers[index - 1]
      }
    }

    return nil
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    viewControllerAfter viewController: UIViewController
  ) -> UIViewController? {
    if let pagerController = pageViewController.viewControllers?.first as? PagerViewController {
      let index = pagerController.getPageIndex()
      if index < pageControllers.count - 1 {
        onPageWillAppear?(index + 1)
        return pageControllers[index + 1]
      }
    }

    return nil
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    didFinishAnimating finished: Bool,
    previousViewControllers: [UIViewController],
    transitionCompleted completed: Bool
  ) {
    if completed {
      isTransitioning = false
      if let currentVC = pageViewController.viewControllers?.first as? PagerViewController,
         let newIndex = pageControllers.firstIndex(of: currentVC)
      {
        currentPageIndex = newIndex
      }
    }
  }

  func pageViewController(
    _ pageViewController: UIPageViewController,
    willTransitionTo pendingViewControllers: [UIViewController]
  ) {
    isTransitioning = true
  }
}

// MARK: Add this extension to implement insert and remove page view

extension EnhancePagerController {
  public func insertPageView(view: UIView, animated: Bool = false) {
    let index = pageControllers.count
    let vc = PagerViewController(index: index, view: view)

    let hasPageControllerBefore = pageControllers.count > 0

    pageControllers.append(vc)

    if !hasPageControllerBefore {
      setViewControllers([vc], direction: .forward, animated: animated)
    }
  }

  public func removePageView(at index: Int) {
    pageControllers.remove(at: index)

    if currentPageIndex == index {
      if !pageControllers.isEmpty {
        let newIndex = min(index, pageControllers.count - 1)
        let newVC = pageControllers[newIndex]
        setViewControllers([newVC], direction: .forward, animated: true)
        currentPageIndex = newIndex
      } else {
        //        let emptyVC = UIViewController()
        //        self.setViewControllers([emptyVC], direction: .forward, animated: false)
        currentPageIndex = 0
      }
    } else if currentPageIndex > index {
      currentPageIndex -= 1
    }

    for (i, pagerVC) in pageControllers.enumerated() {
      pagerVC.setPageIndex(index: i)
    }
  }
}

// MARK: PagerController utils

extension EnhancePagerController {
  public func setCurrentPage(index: Int) {
    if pageControllers.indices.contains(index) {
      let vc = pageControllers[index]
      setViewControllers([vc], direction: .forward, animated: true)
      currentPageIndex = index
    }
  }

  public func getCurrentPageIndex() -> Int {
    return currentPageIndex
  }

  public func getState() -> PagerState {
    if isDragging {
      return .dragging
    } else if isTransitioning {
      return .scrolling
    } else {
      return .idle
    }
  }
}
