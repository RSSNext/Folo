import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { useUnreadByView } from "@follow/store/unread/hooks"
import * as React from "react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { StyleProp, ViewStyle } from "react-native"
import { ScrollView, Text, useWindowDimensions, View } from "react-native"
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"

import { ReAnimatedPressable } from "@/src/components/common/AnimatedComponents"
import { TIMELINE_VIEW_SELECTOR_HEIGHT } from "@/src/constants/ui"
import type { ViewDefinition } from "@/src/constants/views"
import { views } from "@/src/constants/views"
import {
  selectTimeline,
  useSelectedFeed,
  useTimelineSelectorDragProgress,
} from "@/src/modules/screen/atoms"
import { useColor } from "@/src/theme/colors"

import { UnreadCount } from "../subscription/items/UnreadCount"
import { TimelineViewSelectorContextMenu } from "./TimelineViewSelectorContextMenu"

const ACTIVE_WIDTH = 180
const INACTIVE_WIDTH = 48
const ACTIVE_TEXT_WIDTH = 85

export function TimelineViewSelector() {
  const activeViews = useViewWithSubscription()
  const scrollViewRef = React.useRef<ScrollView | null>(null)
  const selectedFeed = useSelectedFeed()

  return (
    <View
      className="flex items-center justify-between py-2"
      style={{ height: TIMELINE_VIEW_SELECTOR_HEIGHT }}
    >
      <ScrollView
        ref={scrollViewRef}
        horizontal
        scrollsToTop={false}
        contentContainerClassName="flex-row gap-3 items-center px-3"
        showsHorizontalScrollIndicator={false}
      >
        {activeViews.map((v, index) => {
          const view = views.find((view) => view.view === v)
          if (!view) return null
          return (
            <ViewItem
              key={view.name}
              index={index}
              view={view}
              scrollViewRef={scrollViewRef}
              isActive={selectedFeed?.type === "view" && selectedFeed.viewId === view.view}
            />
          )
        })}
      </ScrollView>
    </View>
  )
}

function ItemWrapper({
  index,
  activeColor,
  children,
  isActive,
  onPress,
  style,
}: {
  children: React.ReactNode
  index: number
  isActive: boolean
  activeColor: string
  onPress: () => void
  style?: Exclude<StyleProp<ViewStyle>, number>
}) {
  const { width: windowWidth } = useWindowDimensions()
  const activeViews = useViewWithSubscription()
  const dragProgress = useTimelineSelectorDragProgress()

  const activeWidth = Math.max(
    windowWidth - (INACTIVE_WIDTH + 12) * (activeViews.length - 1) - 8 * 2,
    ACTIVE_WIDTH,
  )

  const textWidth = useSharedValue(0)
  const bgColor = useColor("gray5")

  return (
    <ReAnimatedPressable
      className="relative flex h-12 flex-row items-center justify-center gap-2 overflow-hidden rounded-[1.2rem] pl-2"
      onPress={onPress}
      style={useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
          dragProgress.get(),
          [index - 1, index, index + 1],
          [bgColor, activeColor, bgColor],
        ),
        width: interpolate(
          dragProgress.get(),
          [index - 1, index, index + 1],
          [INACTIVE_WIDTH, Math.max(activeWidth, textWidth.value + INACTIVE_WIDTH), INACTIVE_WIDTH],
          "clamp",
        ),
        ...style,
      }))}
    >
      <View
        className="flex-row items-center gap-2"
        onLayout={({ nativeEvent }) => {
          if (isActive) {
            textWidth.set(nativeEvent.layout.width)
          }
        }}
      >
        {children}
      </View>
    </ReAnimatedPressable>
  )
}

function ViewItem({
  view,
  index,
  scrollViewRef,
  isActive,
}: {
  view: ViewDefinition
  // The notification or audio view will be hidden in some cases, so we need to pass the index
  index: number
  scrollViewRef: React.RefObject<ScrollView | null>
  isActive: boolean
}) {
  const textColor = useColor("gray")
  const unreadCount = useUnreadByView(view.view)
  const borderColor = useColor("gray5")
  const { t } = useTranslation("common")
  const itemRef = React.useRef<View>(null)
  const { width: windowWidth } = useWindowDimensions()
  const dragProgress = useTimelineSelectorDragProgress()

  // Scroll to center the active item when it becomes active
  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null
    if (isActive && scrollViewRef.current && itemRef.current) {
      // Give time for animation to start
      timeout = setTimeout(() => {
        itemRef.current?.measureInWindow((x, y, width) => {
          const scrollX = x - windowWidth / 2 + width / 2
          scrollViewRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: true })
        })
      }, 50)
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }, [isActive, scrollViewRef, windowWidth])

  return (
    <TimelineViewSelectorContextMenu type="view" viewId={view.view}>
      <View ref={itemRef}>
        <ItemWrapper
          isActive={isActive}
          index={index}
          activeColor={view.activeColor}
          onPress={() => selectTimeline({ type: "view", viewId: view.view })}
        >
          <View className="relative">
            <Animated.View
              style={useAnimatedStyle(() => ({
                opacity: interpolate(dragProgress.get(), [index - 1, index, index + 1], [0, 1, 0]),
              }))}
            >
              <view.icon color="#fff" height={21} width={21} />
            </Animated.View>
            <Animated.View
              className="absolute"
              style={useAnimatedStyle(() => ({
                opacity: interpolate(dragProgress.get(), [index - 1, index, index + 1], [1, 0, 1]),
              }))}
            >
              <view.icon color={textColor} height={21} width={21} />
            </Animated.View>
          </View>

          <Animated.View
            className="flex flex-row items-center gap-2 overflow-hidden"
            style={useAnimatedStyle(() => ({
              width: interpolate(
                dragProgress.get(),
                [index - 1, index, index + 1],
                [0, ACTIVE_TEXT_WIDTH, 0],
                "clamp",
              ),
            }))}
          >
            <Text key={view.name} className="text-sm font-semibold text-white" numberOfLines={1}>
              {t(view.name)}
            </Text>
            <UnreadCount
              max={99}
              unread={unreadCount}
              dotClassName="size-1.5 rounded-full bg-white"
              textClassName="text-white font-bold"
            />
          </Animated.View>

          {/* Unread indicator for inactive items */}
          <Animated.View
            className="absolute -top-0.5 left-5 size-2 rounded-full border"
            style={useAnimatedStyle(() => ({
              backgroundColor: textColor,
              borderColor,
              display: unreadCount ? "flex" : "none",
              opacity: interpolate(
                dragProgress.get(),
                [index - 1, index, index + 1],
                [1, 0, 1],
                "clamp",
              ),
            }))}
          />
        </ItemWrapper>
      </View>
    </TimelineViewSelectorContextMenu>
  )
}
