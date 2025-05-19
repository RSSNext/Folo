import * as Haptics from "expo-haptics"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import {
  useSharedValue
} from "react-native-reanimated"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"



export const usePullUpToNext = ({
  onRefresh,
  progressViewOffset = 70,
}: {
  onRefresh?: (() => void) | undefined
  progressViewOffset?: number
} = {}) => {
  const dragging = useSharedValue(false)
  const refreshing = useSharedValue(false)
  const overOffset = useSharedValue(0)

  return {
    scrollViewEventHandlers: {
      onScroll: (e: ReanimatedScrollEvent) => {
        if (!dragging.value) return
        overOffset.value = e.contentOffset.y - e.contentSize.height + e.layoutMeasurement.height

        if (overOffset.value > progressViewOffset) {
          if (!refreshing.value) {
            refreshing.value = true
            if (onRefresh) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
            }
          }
        } else {
          refreshing.value = false
        }
        return
      },
      onScrollBeginDrag: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const overOffset =
          e.nativeEvent.contentOffset.y -
          e.nativeEvent.contentSize.height +
          e.nativeEvent.layoutMeasurement.height
        if (overOffset < -50) {
          // Maybe user is pulling down fast for overview
          return
        }
        dragging.value = true
      },
      onScrollEndDrag: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        dragging.value = false
        const velocity = event.nativeEvent.velocity?.y || 0
        if (refreshing.value && velocity < 3) {
          onRefresh?.()
        }
        refreshing.value = false
      },
    },
    pullUpViewProps: {
      overOffset,
      refreshing,
    },
  }
}
