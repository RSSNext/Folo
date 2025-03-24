import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useSetAtom, useStore } from "jotai"
import type { PropsWithChildren } from "react"
import { forwardRef, useContext, useEffect, useState } from "react"
import type { ScrollView, ScrollViewProps, StyleProp, ViewStyle } from "react-native"
import { View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import { useAnimatedScrollHandler } from "react-native-reanimated"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { useScreenIsInSheetModal } from "@/src/lib/navigation/hooks"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"

import { ReAnimatedScrollView } from "../../common/AnimatedComponents"
import type { InternalNavigationHeaderProps } from "../header/NavigationHeader"
import { InternalNavigationHeader } from "../header/NavigationHeader"
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
} & PropsWithChildren

export const SafeNavigationScrollView = forwardRef<ScrollView, SafeNavigationScrollViewProps>(
  (
    {
      children,
      onScroll,
      withBottomInset = false,
      withTopInset = false,
      reanimatedScrollY,
      contentViewClassName,
      contentViewStyle,
      ...props
    },
    ref,
  ) => {
    const insets = useSafeAreaInsets()
    const tabBarHeight = useBottomTabBarHeight()

    const frame = useSafeAreaFrame()
    const sheetModal = useScreenIsInSheetModal()
    const [headerHeight, setHeaderHeight] = useState(() =>
      getDefaultHeaderHeight(frame, sheetModal, insets.top),
    )
    const screenCtxValue = useContext(ScreenItemContext)

    const scrollHandler = useAnimatedScrollHandler({
      onScroll: (event) => {
        if (reanimatedScrollY) {
          reanimatedScrollY.value = event.contentOffset.y
        }

        screenCtxValue.reAnimatedScrollY.value = event.contentOffset.y
      },
    })

    return (
      <NavigationHeaderHeightContext.Provider value={headerHeight}>
        <SetNavigationHeaderHeightContext.Provider value={setHeaderHeight}>
          <ReAnimatedScrollView
            ref={ref}
            onScroll={scrollHandler}
            onContentSizeChange={useTypeScriptHappyCallback(
              (w, h) => {
                screenCtxValue.scrollViewContentHeight.value = h
              },
              [screenCtxValue.scrollViewContentHeight],
            )}
            onLayout={useTypeScriptHappyCallback(
              (e) => {
                screenCtxValue.scrollViewHeight.value = e.nativeEvent.layout.height - headerHeight
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
            <View style={contentViewStyle} className={contentViewClassName}>
              {children}
            </View>
            <View style={{ height: tabBarHeight - (withBottomInset ? insets.bottom : 0) }} />
          </ReAnimatedScrollView>
        </SetNavigationHeaderHeightContext.Provider>
      </NavigationHeaderHeightContext.Provider>
    )
  },
)

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
  const setHeaderHeight = useContext(SetNavigationHeaderHeightContext)

  const hideableBottom = headerHideableBottom?.()
  const screenCtxValue = useContext(ScreenItemContext)

  const setSlot = useSetAtom(screenCtxValue.Slot)
  const store = useStore()
  useEffect(() => {
    setSlot({
      ...store.get(screenCtxValue.Slot),
      header: (
        <SetNavigationHeaderHeightContext.Provider value={setHeaderHeight}>
          <InternalNavigationHeader
            title={props.title}
            headerRight={props.headerRight}
            headerLeft={props.headerLeft}
            hideableBottom={hideableBottom}
            hideableBottomHeight={headerHideableBottomHeight}
            headerTitleAbsolute={headerTitleAbsolute}
            headerTitle={props.headerTitle}
          />
        </SetNavigationHeaderHeightContext.Provider>
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
  ])

  return null
}
