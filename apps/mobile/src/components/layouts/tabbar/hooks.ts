import type { RefObject } from "react"
import { use, useCallback, useEffect, useLayoutEffect, useRef } from "react"
import type { FlatList, ScrollView } from "react-native"
import { findNodeHandle, Platform } from "react-native"

import { performNativeScrollToTop } from "@/src/lib/native"
import {
  SetAttachNavigationScrollViewContext,
  useAttachNavigationScrollView,
} from "@/src/lib/navigation/AttachNavigationScrollViewContext"
import { useScreenIsAppeared, useTabScreenIsFocused } from "@/src/lib/navigation/bottom-tab/hooks"

import { BottomTabBarBackgroundContext } from "./contexts/BottomTabBarBackgroundContext"
import { BottomTabBarHeightContext } from "./contexts/BottomTabBarHeightContext"

export const useBottomTabBarHeight = () => {
  const height = use(BottomTabBarHeightContext)
  return height
}

export const useNavigationScrollToTop = (
  overrideScrollerRef?: React.RefObject<ScrollView> | React.RefObject<FlatList<any>> | null,
) => {
  const attachNavigationScrollViewRef = useAttachNavigationScrollView()
  return useCallback(() => {
    const $scroller = overrideScrollerRef?.current ?? attachNavigationScrollViewRef?.current
    if (!$scroller) return

    if (Platform.OS === "ios") {
      const reactTag = findNodeHandle($scroller)
      if (reactTag) {
        performNativeScrollToTop(reactTag)
        return
      }
    }

    if ("scrollTo" in $scroller) {
      void ($scroller as ScrollView).scrollTo({
        y: 0,
        animated: true,
      })
    } else if ("scrollToIndex" in $scroller) {
      void ($scroller as FlatList<any>).scrollToIndex({
        index: 0,
        animated: true,
      })
    } else if ("scrollToOffset" in $scroller) {
      void ($scroller as FlatList<any>).scrollToOffset({
        offset: 0,
        animated: true,
      })
    }
    return
  }, [attachNavigationScrollViewRef, overrideScrollerRef])
}

export const useRegisterNavigationScrollView = <T = unknown>(active = true) => {
  const scrollViewRef = useRef<T>(null)
  const tabScreenIsFocused = useScreenIsAppeared()
  const setAttachNavigationScrollViewRef = use(SetAttachNavigationScrollViewContext)

  useEffect(() => {
    if (!active) return
    if (!setAttachNavigationScrollViewRef) return
    if (!tabScreenIsFocused) return
    if (
      scrollViewRef.current &&
      typeof scrollViewRef.current === "object" &&
      "checkScrollToBottom" in scrollViewRef.current &&
      typeof scrollViewRef.current.checkScrollToBottom === "function"
    ) {
      scrollViewRef.current.checkScrollToBottom()
    }

    setAttachNavigationScrollViewRef(scrollViewRef as unknown as RefObject<ScrollView>)
  }, [setAttachNavigationScrollViewRef, scrollViewRef, active, tabScreenIsFocused])
  return scrollViewRef
}

export const useResetTabOpacityWhenFocused = () => {
  const { opacity } = use(BottomTabBarBackgroundContext)
  const tabScreenIsFocus = useTabScreenIsFocused()
  useLayoutEffect(() => {
    if (tabScreenIsFocus) {
      opacity.value = 1
    }
  }, [tabScreenIsFocus, opacity])
}
