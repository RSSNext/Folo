import { useTypeScriptHappyCallback } from "@follow/hooks"
import { cn } from "@follow/utils"
import { useSetAtom, useStore } from "jotai"
import type { PropsWithChildren } from "react"
import { use, useImperativeHandle, useLayoutEffect, useRef, useState } from "react"
import type { ScrollView, ScrollViewProps, StyleProp, ViewStyle } from "react-native"
import { findNodeHandle, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import { runOnJS, useAnimatedScrollHandler } from "react-native-reanimated"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { isScrollToEnd } from "@/src/lib/native"
import { useInTabScreen } from "@/src/lib/navigation/bottom-tab/hooks"
import { useScreenIsInSheetModal } from "@/src/lib/navigation/hooks"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"

import { ReAnimatedScrollView } from "../../common/AnimatedComponents"
import type { InternalNavigationHeaderProps } from "../header/NavigationHeader"
import { InternalNavigationHeader } from "../header/NavigationHeader"
import { BottomTabBarBackgroundContext } from "../tabbar/contexts/BottomTabBarBackgroundContext"
import { getDefaultHeaderHeight } from "../utils"
import {
  NavigationHeaderHeightContext,
  SetNavigationHeaderHeightContext,
} from "./NavigationHeaderContext"

type SafeNavigationScrollViewProps = Omit<ScrollViewProps, "onScroll"> & {
  onScroll?: (e: ReanimatedScrollEvent) => void

  // For scroll view content adjustment behavior
  withTopInset?: boolean
  withBottomInset?: boolean

  // to sharedValue
  reanimatedScrollY?: SharedValue<number>

  contentViewStyle?: StyleProp<ViewStyle>
  contentViewClassName?: string

  Header?: React.ReactNode
  ScrollViewBottom?: React.ReactNode
} & PropsWithChildren

export interface ForwardedSafeNavigationScrollView extends ScrollView {
  checkScrollToBottom: () => void
}
export const SafeNavigationScrollView = ({
  ref: forwardedRef,
  children,
  onScroll,
  withBottomInset = false,
  withTopInset = false,
  reanimatedScrollY,
  contentViewClassName,
  contentViewStyle,
  Header,
  ScrollViewBottom,
  ...props
}: SafeNavigationScrollViewProps & { ref?: React.Ref<ScrollView | null> }) => {
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()

  const frame = useSafeAreaFrame()
  const sheetModal = useScreenIsInSheetModal()
  const [headerHeight, setHeaderHeight] = useState(() =>
    getDefaultHeaderHeight(frame, sheetModal, insets.top),
  )
  const screenCtxValue = use(ScreenItemContext)

  const ref = useRef<ScrollView>(null)
  useImperativeHandle(forwardedRef, () => {
    return Object.assign({}, ref.current!, {
      checkScrollToBottom,
    })
  })
  const { opacity } = use(BottomTabBarBackgroundContext)

  const inTabScreen = useInTabScreen()

  function checkScrollToBottom() {
    if (!inTabScreen) {
      return
    }
    const handle = findNodeHandle(ref.current!)
    if (!handle) {
      return
    }

    isScrollToEnd(handle).then((isEnd) => {
      opacity.value = isEnd ? 0 : 1
    })
  }
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      if (reanimatedScrollY) {
        reanimatedScrollY.value = event.contentOffset.y
      }
      if (onScroll) {
        runOnJS(onScroll)(event)
      }
      runOnJS(checkScrollToBottom)()
      screenCtxValue.reAnimatedScrollY.value = event.contentOffset.y
    },
  })

  return (
    <NavigationHeaderHeightContext value={headerHeight}>
      <SetNavigationHeaderHeightContext value={setHeaderHeight}>
        {Header}
        <ReAnimatedScrollView
          ref={ref}
          onScroll={scrollHandler}
          onContentSizeChange={useTypeScriptHappyCallback(
            (w, h) => {
              screenCtxValue.scrollViewContentHeight.value = h
              checkScrollToBottom()
            },
            [screenCtxValue.scrollViewContentHeight],
          )}
          onLayout={useTypeScriptHappyCallback(
            (e) => {
              screenCtxValue.scrollViewHeight.value = e.nativeEvent.layout.height - headerHeight
              checkScrollToBottom()
            },
            [screenCtxValue.scrollViewHeight, headerHeight],
          )}
          automaticallyAdjustContentInsets={false}
          automaticallyAdjustsScrollIndicatorInsets={false}
          scrollIndicatorInsets={{
            top: headerHeight,
            bottom: tabBarHeight,
          }}
          {...props}
        >
          <View style={{ height: headerHeight - (withTopInset ? insets.top : 0) }} />
          <View style={contentViewStyle} className={cn("flex-1", contentViewClassName)}>
            {children}
          </View>
          {ScrollViewBottom}
          <View style={{ height: tabBarHeight - (withBottomInset ? insets.bottom : 0) }} />
        </ReAnimatedScrollView>
      </SetNavigationHeaderHeightContext>
    </NavigationHeaderHeightContext>
  )
}

export const NavigationBlurEffectHeaderView = ({
  headerHideableBottom,
  headerHideableBottomHeight,
  headerTitleAbsolute,
  ...props
}: InternalNavigationHeaderProps & {
  blurThreshold?: number
  headerHideableBottom?: () => React.ReactNode
  headerHideableBottomHeight?: number
  headerTitleAbsolute?: boolean
}) => {
  const hideableBottom = headerHideableBottom?.()
  return (
    <View className="absolute inset-x-0 top-0 z-[99]">
      <InternalNavigationHeader
        title={props.title}
        headerRight={props.headerRight}
        headerLeft={props.headerLeft}
        hideableBottom={hideableBottom}
        hideableBottomHeight={headerHideableBottomHeight}
        headerTitleAbsolute={headerTitleAbsolute}
        headerTitle={props.headerTitle}
        promptBeforeLeave={props.promptBeforeLeave}
        isLoading={props.isLoading}
      />
    </View>
  )
}

/**
 * @deprecated
 * please use `NavigationBlurEffectHeaderView` instead, pass `<NavigationBlurEffectHeaderView />` in `SafeNavigationScrollView`'s `Header` prop
 *
 * e.g. `<SafeNavigationScrollView Header={<NavigationBlurEffectHeaderView />} />`
 * @see NavigationBlurEffectHeaderView
 */
export const NavigationBlurEffectHeader = ({
  headerHideableBottom,
  headerHideableBottomHeight,
  headerTitleAbsolute,
  ...props
}: InternalNavigationHeaderProps & {
  blurThreshold?: number
  headerHideableBottomHeight?: number
  headerHideableBottom?: () => React.ReactNode
  headerTitleAbsolute?: boolean
}) => {
  const setHeaderHeight = use(SetNavigationHeaderHeightContext)

  const hideableBottom = headerHideableBottom?.()
  const screenCtxValue = use(ScreenItemContext)

  const setSlot = useSetAtom(screenCtxValue.Slot)
  const store = useStore()
  useLayoutEffect(() => {
    setSlot({
      ...store.get(screenCtxValue.Slot),
      header: (
        <SetNavigationHeaderHeightContext value={setHeaderHeight}>
          <InternalNavigationHeader
            title={props.title}
            headerRight={props.headerRight}
            headerLeft={props.headerLeft}
            hideableBottom={hideableBottom}
            hideableBottomHeight={headerHideableBottomHeight}
            headerTitleAbsolute={headerTitleAbsolute}
            headerTitle={props.headerTitle}
            promptBeforeLeave={props.promptBeforeLeave}
            isLoading={props.isLoading}
          />
        </SetNavigationHeaderHeightContext>
      ),
    })
  }, [
    screenCtxValue.Slot,
    headerHideableBottomHeight,
    headerTitleAbsolute,
    hideableBottom,
    props.headerLeft,
    props.headerRight,
    props.title,
    setHeaderHeight,
    setSlot,
    store,
    props.headerTitle,
    props.promptBeforeLeave,
    props.isLoading,
  ])

  return null
}
