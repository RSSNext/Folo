import { cn } from "@follow/utils"
import * as Haptics from "expo-haptics"
import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native"
import { Text, View } from "react-native"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { ArrowLeftCuteReIcon } from "@/src/icons/arrow_left_cute_re"

interface EntryPullUpToNextProps {
  active: boolean
  hide?: boolean
}

/**
 * Component that handles pulling up to navigate to the next unread entry
 */
const EntryPullUpToNext = ({ active, hide = false }: EntryPullUpToNextProps) => {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const textColor = useColor("secondaryLabel")
  const iconColor = useColor("label")

  return (
    <View
      className={cn(
        "absolute bottom-0 flex w-full translate-y-full flex-row items-center justify-center gap-2 pt-4 transition-all duration-200",
        hide ? "opacity-0" : "opacity-100",
      )}
      style={{ paddingBottom: insets.bottom + 20 }}
    >
      <View
        className={cn(
          "flex flex-row items-center gap-2 transition-all duration-200",
          active ? "opacity-50" : "opacity-80",
        )}
      >
        <View
          className={cn(
            "rotate-90 transition-all duration-200",
            active ? "opacity-0" : "opacity-100",
          )}
        >
          <ArrowLeftCuteReIcon width={16} height={16} color={iconColor} />
        </View>
        <Text style={{ color: textColor }}>
          {active ? t("entry.release_to_next_entry") : t("entry.pull_up_to_next_entry")}
        </Text>
      </View>
    </View>
  )
}

export const usePullUpToNext = ({
  enabled = true,
  onRefresh,
  progressViewOffset = 70,
}: {
  enabled?: boolean
  onRefresh?: (() => void) | undefined
  progressViewOffset?: number
} = {}) => {
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

  if (!enabled) {
    return {
      scrollViewEventHandlers: {},
      pullUpViewProps: {
        active: false,
        hide: dragState,
      } satisfies EntryPullUpToNextProps,
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
      active: refreshing,
      hide: !dragState,
    } satisfies EntryPullUpToNextProps,
    EntryPullUpToNext,
  }
}
