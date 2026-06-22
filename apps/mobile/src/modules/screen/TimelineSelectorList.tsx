import { useTypeScriptHappyCallback } from "@follow/hooks"
import { usePrefetchSubscription } from "@follow/store/subscription/hooks"
import { usePrefetchUnread } from "@follow/store/unread/hooks"
import { nextFrame } from "@follow/utils"
import type { FlashListProps, FlashListRef } from "@shopify/flash-list"
import { FlashList } from "@shopify/flash-list"
import * as Haptics from "expo-haptics"
import { use, useCallback, useEffect, useImperativeHandle, useRef } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import { RefreshControl, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { useBottomTabBarHeight } from "@/src/components/layouts/tabbar/hooks"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"
import { useHeaderHeight } from "@/src/modules/screen/hooks/useHeaderHeight"

import { EntryListEmpty } from "../entry-list/EntryListEmpty"
import { shouldApplyScrollResetSignal } from "./scroll-reset"

type Props = {
  onRefresh: () => void
  isRefetching: boolean
  onResetScrollSignalConsumed?: (signal: number) => void
  resetScrollSignal?: number
}

const usePendingScrollReset = (
  resetScrollSignal: number | undefined,
  scrollToTop: () => boolean,
  onResetScrollSignalConsumed?: (signal: number) => void,
) => {
  const appliedResetScrollSignalRef = useRef<number | undefined>(undefined)
  const canApplyScrollResetRef = useRef(false)
  const flushPendingScrollReset = useCallback(() => {
    if (!canApplyScrollResetRef.current) return
    if (
      !shouldApplyScrollResetSignal({
        resetSignal: resetScrollSignal,
        appliedResetSignal: appliedResetScrollSignalRef.current,
      })
    ) {
      return
    }

    requestAnimationFrame(() => {
      if (scrollToTop()) {
        appliedResetScrollSignalRef.current = resetScrollSignal
        if (resetScrollSignal !== undefined) {
          onResetScrollSignalConsumed?.(resetScrollSignal)
        }
      }
    })
  }, [onResetScrollSignalConsumed, resetScrollSignal, scrollToTop])

  useEffect(() => {
    flushPendingScrollReset()
  }, [flushPendingScrollReset])

  return useCallback(() => {
    canApplyScrollResetRef.current = true
    flushPendingScrollReset()
  }, [flushPendingScrollReset])
}

export const TimelineSelectorList = ({
  ref: forwardedRef,
  onRefresh,
  isRefetching,
  onResetScrollSignalConsumed,
  resetScrollSignal,
  ...props
}: Props &
  Omit<FlashListProps<any>, "onRefresh"> & { ref?: React.Ref<FlashListRef<any> | null> }) => {
  const ref = useRef<FlashListRef<any>>(null)
  useImperativeHandle(forwardedRef, () => ref.current!)
  const { refetch: unreadRefetch } = usePrefetchUnread()
  const { refetch: subscriptionRefetch } = usePrefetchSubscription()

  const headerHeight = useHeaderHeight()
  const { scrollViewHeight, scrollViewContentHeight, reAnimatedScrollY } = use(ScreenItemContext)!

  const tabBarHeight = useBottomTabBarHeight()
  const scrollToTop = useCallback(() => {
    const scroller = ref.current
    if (!scroller) return false

    scroller.scrollToOffset({
      offset: 0,
      animated: false,
    })
    reAnimatedScrollY.value = 0
    return true
  }, [reAnimatedScrollY])
  const markScrollResetReady = usePendingScrollReset(
    resetScrollSignal,
    scrollToTop,
    onResetScrollSignalConsumed,
  )

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      props.onScroll?.(e)

      reAnimatedScrollY.value = e.nativeEvent.contentOffset.y
    },
    [props, reAnimatedScrollY],
  )
  const systemFill = useColor("secondaryLabel")

  const onLayout = useTypeScriptHappyCallback(
    (e) => {
      props.onLayout?.(e)
      scrollViewHeight.value = e.nativeEvent.layout.height - headerHeight - tabBarHeight
    },
    [headerHeight, props, scrollViewHeight, tabBarHeight],
  ) as FlashListProps<any>["onLayout"]

  const onContentSizeChange = useTypeScriptHappyCallback(
    (w, h) => {
      props.onContentSizeChange?.(w, h)
      scrollViewContentHeight.value = h
      markScrollResetReady()
    },
    [markScrollResetReady, props, scrollViewContentHeight],
  ) as FlashListProps<any>["onContentSizeChange"]
  const onLoad = useTypeScriptHappyCallback(
    (info) => {
      props.onLoad?.(info)
      markScrollResetReady()
    },
    [markScrollResetReady, props],
  ) as FlashListProps<any>["onLoad"]
  const onCommitLayoutEffect = useTypeScriptHappyCallback(() => {
    props.onCommitLayoutEffect?.()
    markScrollResetReady()
  }, [markScrollResetReady, props]) as FlashListProps<any>["onCommitLayoutEffect"]

  if (props.data?.length === 0) {
    return <EntryListEmpty />
  }

  return (
    <View style={props.style} className="flex-1">
      <FlashList
        automaticallyAdjustsScrollIndicatorInsets={false}
        automaticallyAdjustContentInsets={false}
        ref={ref}
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
        onLayout={onLayout}
        onLoad={onLoad}
        onCommitLayoutEffect={onCommitLayoutEffect}
        onContentSizeChange={onContentSizeChange}
        onScroll={onScroll}
        onEndReached={() => {
          nextFrame(() => {
            props.onEndReached?.()
          })
        }}
      />
    </View>
  )
}

export const TimelineSelectorMasonryList = ({
  ref: forwardedRef,
  onRefresh,
  isRefetching,
  onResetScrollSignalConsumed,
  resetScrollSignal,
  ...props
}: Props &
  Omit<FlashListProps<any>, "onRefresh"> & {
    ref?: React.Ref<FlashListRef<any> | null>
  }) => {
  const { refetch: unreadRefetch } = usePrefetchUnread()
  const { refetch: subscriptionRefetch } = usePrefetchSubscription()
  const ref = useRef<FlashListRef<any>>(null)
  useImperativeHandle(forwardedRef, () => ref.current!)

  const insets = useSafeAreaInsets()

  const headerHeight = useHeaderHeight()

  const { reAnimatedScrollY } = use(ScreenItemContext)!
  const scrollToTop = useCallback(() => {
    const scroller = ref.current
    if (!scroller) return false

    scroller.scrollToOffset({
      offset: 0,
      animated: false,
    })
    reAnimatedScrollY.value = 0
    return true
  }, [reAnimatedScrollY])
  const markScrollResetReady = usePendingScrollReset(
    resetScrollSignal,
    scrollToTop,
    onResetScrollSignalConsumed,
  )

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      props.onScroll?.(e)
      reAnimatedScrollY.value = e.nativeEvent.contentOffset.y
    },
    [props, reAnimatedScrollY],
  )

  const tabBarHeight = useBottomTabBarHeight()
  const onContentSizeChange = useTypeScriptHappyCallback(
    (w, h) => {
      props.onContentSizeChange?.(w, h)
      markScrollResetReady()
    },
    [markScrollResetReady, props],
  ) as FlashListProps<any>["onContentSizeChange"]
  const onLoad = useTypeScriptHappyCallback(
    (info) => {
      props.onLoad?.(info)
      markScrollResetReady()
    },
    [markScrollResetReady, props],
  ) as FlashListProps<any>["onLoad"]
  const onCommitLayoutEffect = useTypeScriptHappyCallback(() => {
    props.onCommitLayoutEffect?.()
    markScrollResetReady()
  }, [markScrollResetReady, props]) as FlashListProps<any>["onCommitLayoutEffect"]

  const systemFill = useColor("secondaryLabel")

  if (props.data?.length === 0) {
    return <EntryListEmpty />
  }

  return (
    <FlashList
      ref={ref}
      masonry
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
      {...props}
      onLoad={onLoad}
      onCommitLayoutEffect={onCommitLayoutEffect}
      onContentSizeChange={onContentSizeChange}
      contentContainerStyle={[
        {
          paddingTop: headerHeight,
          paddingBottom: tabBarHeight,
        },
        props.contentContainerStyle,
      ]}
      scrollIndicatorInsets={{
        top: headerHeight - insets.top,
        bottom: tabBarHeight ? tabBarHeight - insets.bottom : undefined,
        ...props.scrollIndicatorInsets,
      }}
      onScroll={onScroll}
    />
  )
}
