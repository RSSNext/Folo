import { useTypeScriptHappyCallback } from "@follow/hooks"
import { nextFrame } from "@follow/utils"
import type {
  FlashListProps,
  MasonryFlashListProps,
  MasonryFlashListRef,
} from "@shopify/flash-list"
import { FlashList, MasonryFlashList } from "@shopify/flash-list"
import * as Haptics from "expo-haptics"
import type { ElementRef, RefObject } from "react"
import { forwardRef, useCallback, useContext, useImperativeHandle, useRef } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import { findNodeHandle, RefreshControl } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { BottomTabBarBackgroundContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarBackgroundContext"
import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { isScrollToEnd } from "@/src/lib/native"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import { useHeaderHeight } from "@/src/modules/screen/hooks/useHeaderHeight"
import { usePrefetchSubscription } from "@/src/store/subscription/hooks"
import { usePrefetchUnread } from "@/src/store/unread/hooks"

import { EntryListEmpty } from "../entry-list/EntryListEmpty"

type Props = {
  onRefresh: () => void
  isRefetching: boolean
}

export const TimelineSelectorList = forwardRef<
  FlashList<any>,
  Props & Omit<FlashListProps<any>, "onRefresh">
>(({ onRefresh, isRefetching, ...props }, forwardedRef) => {
  const ref = useRef<FlashList<any>>(null)
  useImperativeHandle(forwardedRef, () => ref.current!)
  const { refetch: unreadRefetch } = usePrefetchUnread()
  const { refetch: subscriptionRefetch } = usePrefetchSubscription()

  const headerHeight = useHeaderHeight()
  const { reAnimatedScrollY, scrollViewHeight, scrollViewContentHeight } =
    useContext(ScreenItemContext)!
  const { opacity } = useContext(BottomTabBarBackgroundContext)
  const checkScrollToBottom = useCallback(() => {
    const handle = findNodeHandle(ref.current!)
    if (!handle) {
      return
    }
    isScrollToEnd(handle).then((isEnd) => {
      opacity.value = isEnd ? 0 : 1
    })
  }, [opacity])
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      props.onScroll?.(e)

      reAnimatedScrollY.value = e.nativeEvent.contentOffset.y
      checkScrollToBottom()
    },
    [props, reAnimatedScrollY, checkScrollToBottom],
  )

  const tabBarHeight = useBottomTabBarHeight()

  const systemFill = useColor("secondaryLabel")

  const onLayout = useTypeScriptHappyCallback(
    (e) => {
      scrollViewHeight.value = e.nativeEvent.layout.height - headerHeight - tabBarHeight
    },
    [scrollViewHeight],
  ) as FlashListProps<any>["onLayout"]

  const onContentSizeChange = useTypeScriptHappyCallback(
    (w, h) => {
      scrollViewContentHeight.value = h
    },
    [scrollViewContentHeight],
  ) as FlashListProps<any>["onContentSizeChange"]

  if (props.data?.length === 0) {
    return <EntryListEmpty />
  }

  return (
    <FlashList
      automaticallyAdjustsScrollIndicatorInsets={false}
      automaticallyAdjustContentInsets={false}
      ref={ref}
      onLayout={onLayout}
      onContentSizeChange={onContentSizeChange}
      refreshControl={
        <RefreshControl
          progressViewOffset={headerHeight}
          // // FIXME: not sure why we need set tintColor manually here, otherwise we can not see the refresh indicator
          tintColor={systemFill}
          onRefresh={() => {
            unreadRefetch()
            subscriptionRefetch()
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            onRefresh()
          }}
          refreshing={isRefetching}
        />
      }
      scrollIndicatorInsets={{
        top: headerHeight,
        bottom: tabBarHeight,
      }}
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingBottom: tabBarHeight,
      }}
      {...props}
      onScroll={onScroll}
      onEndReached={() => {
        nextFrame(() => {
          props.onEndReached?.()
        })
      }}
    />
  )
})

export const TimelineSelectorMasonryList = forwardRef<
  ElementRef<typeof MasonryFlashList>,
  Props & Omit<MasonryFlashListProps<any>, "onRefresh">
>(({ onRefresh, isRefetching, ...props }, ref) => {
  const { refetch: unreadRefetch } = usePrefetchUnread()
  const { refetch: subscriptionRefetch } = usePrefetchSubscription()

  const insets = useSafeAreaInsets()

  const headerHeight = useHeaderHeight()

  const { reAnimatedScrollY } = useContext(ScreenItemContext)!

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      props.onScroll?.(e)
      reAnimatedScrollY.value = e.nativeEvent.contentOffset.y
    },
    [props, reAnimatedScrollY],
  )

  const tabBarHeight = useBottomTabBarHeight()

  const systemFill = useColor("secondaryLabel")

  if (props.data?.length === 0) {
    return <EntryListEmpty />
  }

  return (
    <MasonryFlashList
      ref={ref as RefObject<MasonryFlashListRef<any>>}
      refreshControl={
        <RefreshControl
          progressViewOffset={headerHeight}
          // // FIXME: not sure why we need set tintColor manually here, otherwise we can not see the refresh indicator
          tintColor={systemFill}
          onRefresh={() => {
            unreadRefetch()
            subscriptionRefetch()
            onRefresh()
          }}
          refreshing={isRefetching}
        />
      }
      scrollIndicatorInsets={{
        top: headerHeight - insets.top,
        bottom: tabBarHeight ? tabBarHeight - insets.bottom : undefined,
      }}
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingBottom: tabBarHeight,
      }}
      {...props}
      onScroll={onScroll}
    />
  )
})
