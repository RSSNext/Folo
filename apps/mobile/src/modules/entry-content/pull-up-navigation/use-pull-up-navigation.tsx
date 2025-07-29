import * as Haptics from "expo-haptics"
import { useCallback, useRef, useState } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import { useSharedValue } from "react-native-reanimated"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"

import { PullUpIndicatorIos } from "./PullUpIndicatorIos"
import type { UsePullUpToNextProps, UsePullUpToNextReturn } from "./types"

// eslint-disable-next-line react-refresh/only-export-components
const EmptyGestureWrapper: UsePullUpToNextReturn["GestureWrapper"] = ({
  children,
}: {
  children?: React.ReactNode
}) => children

export const usePullUpToNext = ({
  enabled = true,
  onRefresh,
  progressViewOffset = 70,
}: UsePullUpToNextProps = {}): UsePullUpToNextReturn => {
  const dragging = useRef(false)
  const isOverThreshold = useRef(false)
  const [dragState, setDragState] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const onScroll = useCallback(
    (e: ReanimatedScrollEvent) => {
      if (!dragging.current) return
      const overOffset = e.contentOffset.y - e.contentSize.height + e.layoutMeasurement.height

      // Ratio used to determine when to deactivate the pulling threshold
      const thresholdRatio = 0.95
      if (overOffset > progressViewOffset) {
        if (!isOverThreshold.current && onRefresh) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        }
        isOverThreshold.current = true
        setRefreshing(true)
      } else if (overOffset < progressViewOffset * thresholdRatio) {
        if (isOverThreshold.current && onRefresh) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)
        }
        isOverThreshold.current = false
        setRefreshing(false)
      }
      return
    },
    [dragging, onRefresh, progressViewOffset],
  )
  const onScrollBeginDrag = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const beginOffset =
        e.nativeEvent.contentOffset.y -
        e.nativeEvent.contentSize.height +
        e.nativeEvent.layoutMeasurement.height
      if (beginOffset < -50) {
        // Maybe user is pulling down fast for overview
        return
      }
      dragging.current = true
      setDragState(true)
    },
    [dragging],
  )
  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragging.current = false
      setDragState(false)
      const velocity = event.nativeEvent.velocity?.y || 0
      if (isOverThreshold.current && velocity < 3) {
        onRefresh?.()
      }
      isOverThreshold.current = false
      setRefreshing(false)
    },
    [dragging, onRefresh],
  )
  const translateY = useSharedValue(0)
  if (!enabled) {
    return {
      scrollViewEventHandlers: {},
      pullUpViewProps: {
        active: false,
        hide: dragState,
        translateY,
      } satisfies UsePullUpToNextReturn["pullUpViewProps"],
      EntryPullUpToNext: () => null,
      GestureWrapper: EmptyGestureWrapper,
      gestureWrapperProps: {
        enabled: false,
      },
    }
  }
  return {
    scrollViewEventHandlers: {
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
    },
    pullUpViewProps: {
      active: refreshing,
      hide: !dragState,
      translateY,
    } satisfies UsePullUpToNextReturn["pullUpViewProps"],
    EntryPullUpToNext: PullUpIndicatorIos,
    GestureWrapper: EmptyGestureWrapper,
    gestureWrapperProps: {
      enabled: false,
    },
  }
}
