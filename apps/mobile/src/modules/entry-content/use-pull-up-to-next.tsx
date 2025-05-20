import * as Haptics from "expo-haptics"
import { useCallback, useRef, useState } from "react"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"

export const usePullUpToNext = ({
  enabled: enabled = true,
  onRefresh,
  progressViewOffset = 70,
}: {
  enabled?: boolean
  onRefresh?: (() => void) | undefined
  progressViewOffset?: number
} = {}) => {
  const dragging = useRef(false)
  const isOverThreshold = useRef(false)
  const [refreshing, setRefreshing] = useState(false)

  const onScroll = useCallback(
    (e: ReanimatedScrollEvent) => {
      if (!dragging.current) return
      const overOffset = e.contentOffset.y - e.contentSize.height + e.layoutMeasurement.height

      if (overOffset > progressViewOffset) {
        if (!isOverThreshold.current && onRefresh) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
        }
        isOverThreshold.current = true
        setRefreshing(true)
      } else {
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
    },
    [dragging],
  )

  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      dragging.current = false
      const velocity = event.nativeEvent.velocity?.y || 0
      if (isOverThreshold.current && velocity < 3) {
        onRefresh?.()
      }
      isOverThreshold.current = false
      setRefreshing(false)
    },
    [dragging, onRefresh],
  )

  if (!enabled) {
    return {
      scrollViewEventHandlers: {},
      pullUpViewProps: {},
      EntryPullUpToNext: () => null,
    }
  }

  return {
    scrollViewEventHandlers: {
      onScroll,
      onScrollBeginDrag,
      onScrollEndDrag,
    },
    pullUpViewProps: {
      refreshing,
    },
  }
}
