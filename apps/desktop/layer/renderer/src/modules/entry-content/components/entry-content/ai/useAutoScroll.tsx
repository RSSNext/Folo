import { springScrollTo } from "@follow/utils/scroller"
import * as React from "react"

const SCROLL_THRESHOLD = 80

// Custom hook for auto-scroll with interruption logic
export const useAutoScroll = (viewport: HTMLElement | null, enabled: boolean) => {
  const scrollAnimationRef = React.useRef<{ stop: () => void } | null>(null)
  const userScrolledUpRef = React.useRef(false)
  const lastScrollTopRef = React.useRef(0)
  const resizeObserverRef = React.useRef<ResizeObserver | null>(null)
  // 添加程序滚动标记，避免误判用户滚动
  const isProgrammaticScrollRef = React.useRef(false)
  // 记录滚动动画完成的 callback
  const scrollAnimationCompleteRef = React.useRef<number | null>(null)

  const isNearBottom = React.useCallback((element: HTMLElement) => {
    return element.scrollTop + element.clientHeight >= element.scrollHeight - 10
  }, [])

  const scrollToBottom = React.useCallback(() => {
    if (!viewport || userScrolledUpRef.current) return

    const targetScrollTop = viewport.scrollHeight - viewport.clientHeight
    if (targetScrollTop <= 0) return

    // 标记为程序滚动
    isProgrammaticScrollRef.current = true

    // 清除之前的动画完成定时器
    if (scrollAnimationCompleteRef.current) {
      window.clearTimeout(scrollAnimationCompleteRef.current)
    }

    // Stop any existing animation
    if (scrollAnimationRef.current) {
      scrollAnimationRef.current.stop()
    }

    // Use springScrollTo for smooth scrolling
    const animation = springScrollTo(targetScrollTop, viewport)
    scrollAnimationRef.current = {
      stop: () => animation.stop(),
    }

    // 动画完成后重置程序滚动标记
    animation
      .then(() => {
        scrollAnimationCompleteRef.current = window.setTimeout(() => {
          isProgrammaticScrollRef.current = false
        }, 100) // 给一个小的延迟，确保所有相关的 scroll 事件都被正确标记
      })
      .catch(() => {
        // 动画被中断时也要重置标记
        isProgrammaticScrollRef.current = false
      })

    lastScrollTopRef.current = targetScrollTop
  }, [viewport])

  // Monitor user scrolling behavior
  React.useEffect(() => {
    if (!viewport) return

    const handleScroll = () => {
      const currentScrollTop = viewport.scrollTop

      // 如果是程序滚动，不进行用户滚动检测
      if (isProgrammaticScrollRef.current) {
        lastScrollTopRef.current = currentScrollTop
        return
      }

      const scrollDelta = lastScrollTopRef.current - currentScrollTop

      // If user scrolled up more than threshold, disable auto-scroll
      if (scrollDelta > SCROLL_THRESHOLD) {
        userScrolledUpRef.current = true
      } else if (isNearBottom(viewport)) {
        // If user is near bottom, re-enable auto-scroll
        userScrolledUpRef.current = false
      }

      lastScrollTopRef.current = currentScrollTop
    }

    viewport.addEventListener("scroll", handleScroll, { passive: true })
    return () => viewport.removeEventListener("scroll", handleScroll)
  }, [viewport, isNearBottom])

  // Monitor content height changes for auto-scroll
  React.useEffect(() => {
    if (!viewport || !enabled) return

    const content = viewport.firstElementChild as HTMLElement
    if (!content) return

    // Clean up previous observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect()
    }

    const resizeObserver = new ResizeObserver(() => {
      // Only auto-scroll if user hasn't manually scrolled up
      if (!userScrolledUpRef.current) {
        // Use a small delay to ensure content is fully rendered
        requestAnimationFrame(() => {
          scrollToBottom()
        })
      }
    })

    resizeObserver.observe(content)
    resizeObserverRef.current = resizeObserver

    return () => {
      resizeObserver.disconnect()
      resizeObserverRef.current = null
    }
  }, [viewport, enabled, scrollToBottom])

  // Reset user scroll state when new messages start
  const resetScrollState = React.useCallback(() => {
    userScrolledUpRef.current = false
    isProgrammaticScrollRef.current = false
    if (viewport) {
      lastScrollTopRef.current = viewport.scrollTop
    }
  }, [viewport])

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (scrollAnimationRef.current) {
        scrollAnimationRef.current.stop()
      }
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (scrollAnimationCompleteRef.current) {
        window.clearTimeout(scrollAnimationCompleteRef.current)
      }
    }
  }, [])

  return { resetScrollState, scrollToBottom }
}
