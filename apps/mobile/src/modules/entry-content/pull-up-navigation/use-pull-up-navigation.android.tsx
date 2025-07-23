import * as Haptics from "expo-haptics"
import { useCallback, useRef, useState } from "react"
import { View } from "react-native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import { runOnJS, useSharedValue, withSpring } from "react-native-reanimated"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"

import { useScrollViewProgress } from "@/src/lib/navigation/ScreenItemContext"

import { PullUpIndicatorAndroid } from "./PullUpIndicatorAndroid"
import type { UsePullUpToNextProps, UsePullUpToNextReturn } from "./types"

const THRESHOLD = 70 // The threshold in pixels to trigger the next entry
const FEEDBACK_THRESHOLD = 0.5 // When to give haptic feedback (50% of the way to the threshold)

const GestureWrapper: UsePullUpToNextReturn["GestureWrapper"] = ({
  gesture,
  enabled,
  children,
}) => {
  if (!enabled || !gesture) {
    return <>{children}</>
  }

  return (
    <GestureDetector gesture={gesture}>
      <View className="flex flex-1">{children}</View>
    </GestureDetector>
  )
}

export const usePullUpToNext = ({
  enabled = true,
  onRefresh,
}: UsePullUpToNextProps): UsePullUpToNextReturn => {
  const scrollViewProgress = useScrollViewProgress()
  const isAtEnd = useSharedValue(false)
  const [refreshing, setRefreshing] = useState(false)
  const [dragState, setDragState] = useState(false)
  const feedbackGiven = useRef(false)
  const translateY = useSharedValue(0)

  const initialTouchLocation = useSharedValue<{ x: number; y: number } | null>(null)
  const panGesture = Gesture.Pan()
    .enabled(enabled)
    .manualActivation(true)
    .maxPointers(1)
    .onBegin((event) => {
      initialTouchLocation.value = { x: event.x, y: event.y }
    })
    .onTouchesMove((evt, state) => {
      const isShortContent = scrollViewProgress.value === 1
      // Make sure we only process gestures when at end of content
      if (!isAtEnd.value && !isShortContent) {
        state.fail()
        return
      }
      const changedTouch = evt.changedTouches.at(0)
      if (!initialTouchLocation.value || !changedTouch) {
        state.fail()
        return
      }

      const yDiff = changedTouch.y - initialTouchLocation.value.y
      const isPullUpPanning = yDiff < -1

      if (isPullUpPanning) {
        runOnJS(setDragState)(true)
        state.activate()
      } else {
        state.fail()
      }
    })
    .onUpdate((event) => {
      // Only process upward gestures when at the end of the content
      if (event.translationY >= 0) {
        return
      }
      // Apply a damping effect to make the pull feel more natural
      const pullDistance = Math.min(Math.abs(event.translationY) * 0.7, THRESHOLD * 1.5) / 2
      translateY.value = pullDistance

      // Ratio used to determine when to deactivate the pulling threshold
      const thresholdRatio = 0.95
      // Provide haptic feedback when crossing the threshold
      if (pullDistance > THRESHOLD * FEEDBACK_THRESHOLD && !feedbackGiven.current) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Heavy)
        feedbackGiven.current = true
        runOnJS(setRefreshing)(true)
      } else if (
        pullDistance < THRESHOLD * FEEDBACK_THRESHOLD * thresholdRatio &&
        feedbackGiven.current
      ) {
        feedbackGiven.current = false
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Soft)
        runOnJS(setRefreshing)(false)
      }
    })
    .onEnd(() => {
      feedbackGiven.current = false
      runOnJS(setDragState)(false)

      if (refreshing) {
        if (onRefresh) {
          runOnJS(onRefresh)()
        }
      } else {
        // Not enough pull or not at the end, reset with a nice spring animation
        translateY.value = withSpring(0, {
          damping: 16,
          mass: 1,
          stiffness: 200,
        })

        if (refreshing) {
          runOnJS(setRefreshing)(false)
        }
      }
    })

  // Track whether the scroll view is at the end
  const lastScrollY = useRef(0)
  const handleScroll = useCallback(
    (event: ReanimatedScrollEvent) => {
      const { contentOffset, contentSize, layoutMeasurement } = event
      if (Math.abs(contentOffset.y - lastScrollY.current) < 5) {
        return
      }
      lastScrollY.current = contentOffset.y
      // Check if we're near the bottom of the scroll view with a slightly larger buffer
      const isEnd =
        contentOffset.y >= contentSize.height - layoutMeasurement.height - 20 &&
        contentSize.height > layoutMeasurement.height
      if (isEnd !== isAtEnd.value) {
        isAtEnd.value = isEnd
      }
    },
    [isAtEnd],
  )

  if (!enabled) {
    // Return empty implementation for non-Android platforms
    return {
      scrollViewEventHandlers: {},
      pullUpViewProps: {
        active: false,
        hide: true,
        translateY,
      } satisfies UsePullUpToNextReturn["pullUpViewProps"],
      EntryPullUpToNext: () => null,
      GestureWrapper,
      gestureWrapperProps: {
        enabled: false,
      },
    }
  }

  return {
    scrollViewEventHandlers: {
      onScroll: handleScroll,
    },
    pullUpViewProps: {
      active: refreshing,
      hide: !dragState,
      translateY,
    },

    EntryPullUpToNext: PullUpIndicatorAndroid,
    GestureWrapper,
    gestureWrapperProps: {
      gesture: panGesture,
      enabled,
    },
  }
}
