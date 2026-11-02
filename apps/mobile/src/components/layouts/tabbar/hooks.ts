import { use, useCallback, useEffect, useLayoutEffect, useRef } from "react"
import type { FlatList, ScrollView } from "react-native"
import { findNodeHandle, Platform } from "react-native"

import { performNativeScrollToTop } from "@/src/lib/native"
import { useScreenIsAppeared, useTabScreenIsFocused } from "@/src/lib/navigation/bottom-tab/hooks"
import type { TabScreenContextType } from "@/src/lib/navigation/bottom-tab/TabScreenContext"
import { TabScreenContext } from "@/src/lib/navigation/bottom-tab/TabScreenContext"
import { getNativeScrollView } from "@/src/lib/navigation/navigation-scroll-targets"
import { useNavigationScrollTargets } from "@/src/lib/navigation/NavigationScrollTargetsContext"

import { BottomTabBarBackgroundContext } from "./contexts/BottomTabBarBackgroundContext"
import { BottomTabBarHeightContext } from "./contexts/BottomTabBarHeightContext"

export const useBottomTabBarHeight = () => {
  const height = use(BottomTabBarHeightContext)
  return height
}

const scrollToTop = (scroller: object) => {
  const scrollView = getNativeScrollView(scroller)
  // Nothing to scroll once the list's scroll view unmounted
  if (!scrollView) return

  if (Platform.OS === "ios") {
    const reactTag = findNodeHandle(scrollView as ScrollView)
    if (reactTag) {
      performNativeScrollToTop(reactTag)
      return
    }
  }

  if ("scrollTo" in scroller) {
    void (scroller as ScrollView).scrollTo({
      y: 0,
      animated: true,
    })
  } else if ("scrollToIndex" in scroller) {
    void (scroller as FlatList<unknown>).scrollToIndex({
      index: 0,
      animated: true,
    })
  } else if ("scrollToOffset" in scroller) {
    void (scroller as FlatList<unknown>).scrollToOffset({
      offset: 0,
      animated: true,
    })
  }
}

/** Scrolls the shown list of a tab to the top, for a tap on that tab while it is selected */
export const useNavigationScrollToTop = () => {
  const targets = useNavigationScrollTargets()
  return useCallback(
    (tabScreenIndex: number) => {
      const scroller = targets?.get(tabScreenIndex)?.current
      if (typeof scroller === "object" && scroller !== null) {
        scrollToTop(scroller)
      }
    },
    [targets],
  )
}

/**
 * Makes the list the one its tab scrolls to the top while `active`. A list on a screen pushed
 * over the tab bar, outside every tab, is left out.
 */
export const useRegisterNavigationScrollView = <T = unknown>(active = true) => {
  const scrollViewRef = useRef<T>(null)
  const isAppeared = useScreenIsAppeared()
  const targets = useNavigationScrollTargets()
  // Null outside a tab screen
  const tabScreen = use(TabScreenContext) as TabScreenContextType | null
  const tabScreenIndex = tabScreen?.tabScreenIndex

  useEffect(() => {
    if (!active || !targets || tabScreenIndex === undefined) return
    return targets.register(tabScreenIndex, scrollViewRef)
  }, [active, scrollViewRef, tabScreenIndex, targets])

  useEffect(() => {
    if (!active || !isAppeared) return
    const scrollView = scrollViewRef.current
    if (
      scrollView &&
      typeof scrollView === "object" &&
      "checkScrollToBottom" in scrollView &&
      typeof scrollView.checkScrollToBottom === "function"
    ) {
      scrollView.checkScrollToBottom()
    }
  }, [active, isAppeared])

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
