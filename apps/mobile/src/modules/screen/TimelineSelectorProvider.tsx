import type { FC } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { View } from "react-native"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

import { FakeNativeHeaderTitle } from "@/src/components/layouts/header/FakeNativeHeaderTitle"
import { DefaultHeaderBackButton } from "@/src/components/layouts/header/NavigationHeader"
import { NavigationBlurEffectHeader } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { gentleSpringPreset } from "@/src/constants/spring"
import { TIMELINE_VIEW_SELECTOR_HEIGHT } from "@/src/constants/ui"
import {
  ActionGroup,
  FeedShareActionButton,
  HomeLeftAction,
  MarkAllAsReadActionButton,
  UnreadOnlyActionButton,
} from "@/src/modules/screen/action"
import { TimelineViewSelector } from "@/src/modules/screen/TimelineViewSelector"

import { useEntries, useEntryListContext, useSelectedFeedTitle } from "./atoms"

export function TimelineHeader({ feedId }: { feedId?: string }) {
  const viewTitle = useSelectedFeedTitle()
  const screenType = useEntryListContext().type

  const isFeed = screenType === "feed"
  const isTimeline = screenType === "timeline"
  const isSubscriptions = screenType === "subscriptions"

  const { isFetching } = useEntries()

  return (
    <NavigationBlurEffectHeader
      headerTitle={<AnimatedTitle title={viewTitle} />}
      isLoading={(isFeed || isTimeline) && isFetching}
      headerLeft={useMemo(
        () =>
          isTimeline || isSubscriptions
            ? () => <HomeLeftAction />
            : () => <DefaultHeaderBackButton canDismiss={false} canGoBack={true} />,
        [isTimeline, isSubscriptions],
      )}
      headerRight={useMemo(() => {
        return () => (
          <View className="flex-row items-center justify-end">
            <ActionGroup>
              <UnreadOnlyActionButton />
              <MarkAllAsReadActionButton />
              <FeedShareActionButton feedId={feedId} />
            </ActionGroup>
          </View>
        )
      }, [feedId])}
      headerHideableBottom={isTimeline || isSubscriptions ? TimelineViewSelector : undefined}
      headerHideableBottomHeight={TIMELINE_VIEW_SELECTOR_HEIGHT}
    />
  )
}

const AnimatedTitle: FC<{
  title: string | undefined
}> = ({ title }) => {
  // Track titles and animation state
  const [displayedTitle, setDisplayedTitle] = useState(title)
  const [oldTitle, setOldTitle] = useState<string | undefined>()
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Animation values - only opacity for cross-fade effect
  const newTitleOpacity = useSharedValue(1)
  const oldTitleOpacity = useSharedValue(0)

  // Handle title changes with cross-fade animation
  useEffect(() => {
    if (title !== displayedTitle && title !== undefined && !isAnimating) {
      setIsAnimating(true)
      setOldTitle(displayedTitle)

      // Start cross-fade animation
      oldTitleOpacity.value = 1
      newTitleOpacity.value = 0

      // Fade out old title and fade in new title
      oldTitleOpacity.value = withSpring(0, gentleSpringPreset)

      // Update displayed title and fade in
      timeoutRef.current = setTimeout(() => {
        setDisplayedTitle(title)
        newTitleOpacity.value = withSpring(1, gentleSpringPreset, () => {
          runOnJS(setIsAnimating)(false)
          runOnJS(setOldTitle)(void 0)
        })
      }, 150)
    }
  }, [title, displayedTitle, isAnimating, newTitleOpacity, oldTitleOpacity])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Initialize displayed title
  useEffect(() => {
    if (displayedTitle === undefined && title !== undefined) {
      setDisplayedTitle(title)
    }
  }, [title, displayedTitle])

  const newTitleStyle = useAnimatedStyle(() => ({
    opacity: newTitleOpacity.value,
  }))

  const oldTitleStyle = useAnimatedStyle(() => ({
    opacity: oldTitleOpacity.value,
  }))

  return (
    <View className="relative">
      {/* Current/New Title */}
      <Animated.View style={newTitleStyle}>
        <FakeNativeHeaderTitle>{displayedTitle}</FakeNativeHeaderTitle>
      </Animated.View>

      {/* Old Title (during transition) */}
      {oldTitle && isAnimating && (
        <Animated.View className="absolute inset-0" style={oldTitleStyle}>
          <FakeNativeHeaderTitle>{oldTitle}</FakeNativeHeaderTitle>
        </Animated.View>
      )}
    </View>
  )
}
