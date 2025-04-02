/*
 * @Author: czy0729
 * @Date: 2023-12-27 15:42:54
 * @Last Modified by: czy0729
 * @Last Modified time: 2024-08-13 16:14:43
 *
 * Ported from https://github.com/czy0729/Bangumi/blob/6f2c46bba0bb2c1ffa98fb54d9609d87cb5f06a2/src/components/nested-scroll/hooks/usePagerView.tsx
 * License: MIT
 */
import { useCallback, useMemo, useRef, useState } from "react"
import { Animated, Platform, useAnimatedValue } from "react-native"
import type {
  default as PagerView,
  PagerViewOnPageScrollEventData,
  PagerViewOnPageSelectedEvent,
  PageScrollStateChangedNativeEvent,
} from "react-native-pager-view"

export function usePagerView({
  initialPage = 0,
  onIndexChange,
}: {
  initialPage?: number
  onIndexChange?: (index: number) => void
}) {
  const pagerRef = useRef<PagerView>(null)
  const [activePage, setActivePage] = useState(initialPage)
  const [isIdle, setIdle] = useState(true)

  const setPage = useCallback((page: number, animated = true) => {
    if (animated) {
      pagerRef.current?.setPage(page)
    } else {
      pagerRef.current?.setPageWithoutAnimation(page)
    }
    setActivePage(page)
  }, [])

  const offset = useAnimatedValue(0)
  const position = useAnimatedValue(initialPage)

  const onPageScroll = useMemo(
    () =>
      Animated.event<PagerViewOnPageScrollEventData>(
        [
          {
            nativeEvent: {
              offset,
              position,
            },
          },
        ],
        {
          useNativeDriver: true,
        },
      ),
    [offset, position],
  )

  const onPageSelected = useCallback(
    (e: PagerViewOnPageSelectedEvent) => {
      const { position } = e.nativeEvent
      setActivePage(position)
      if (Platform.OS === "ios") setIdle(true)

      if (typeof onIndexChange === "function") onIndexChange(position)
    },
    [onIndexChange],
  )

  const onPageScrollStateChanged = useCallback(
    ({ nativeEvent: { pageScrollState } }: PageScrollStateChangedNativeEvent) => {
      setIdle(pageScrollState === "idle")
    },
    [],
  )

  return {
    pagerRef,
    setPage,
    page: activePage,
    isIdle,
    position,
    offset,
    onPageScroll,
    onPageSelected,
    onPageScrollStateChanged,
  }
}
