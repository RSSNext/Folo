import { useViewWithSubscription } from "@follow/store/subscription/hooks"
import { useUnreadCountByView } from "@follow/store/unread/hooks"
import * as React from "react"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import type { StyleProp, ViewStyle } from "react-native"
import { ScrollView, Text, useWindowDimensions, View } from "react-native"
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

import { ReAnimatedPressable } from "@/src/components/common/AnimatedComponents"
import { gentleSpringPreset } from "@/src/constants/spring"
import { TIMELINE_VIEW_SELECTOR_HEIGHT } from "@/src/constants/ui"
import type { ViewDefinition } from "@/src/constants/views"
import { views } from "@/src/constants/views"
import { selectTimeline, useSelectedFeed } from "@/src/modules/screen/atoms"
import { useColor } from "@/src/theme/colors"

import { UnreadCount } from "../subscription/items/UnreadCount"
import { TimelineViewSelectorContextMenu } from "./TimelineViewSelectorContextMenu"

const ACTIVE_WIDTH = 180
const INACTIVE_WIDTH = 48

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
        {activeViews.map((v) => {
          const view = views.find((view) => view.view === v)
          if (!view) return null
          return (
            <ViewItem
              key={view.name}
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
  children,
  isActive,
  onPress,
  style,
}: {
  children: React.ReactNode
  isActive: boolean
  onPress: () => void
  style?: Exclude<StyleProp<ViewStyle>, number>
}) {
  const { width: windowWidth } = useWindowDimensions()
  const activeViews = useViewWithSubscription()

  const activeWidth = Math.max(
    windowWidth - (INACTIVE_WIDTH + 12) * (activeViews.length - 1) - 8 * 2,
    ACTIVE_WIDTH,
  )

  const textWidth = useSharedValue(0)
  const width = useSharedValue(
    isActive ? Math.max(activeWidth, textWidth.value + INACTIVE_WIDTH) : INACTIVE_WIDTH,
  )
  const bgColor = useColor("gray5")

  useEffect(() => {
    width.value = withSpring(
      isActive ? Math.max(activeWidth, textWidth.value + INACTIVE_WIDTH) : INACTIVE_WIDTH,
      gentleSpringPreset,
    )
  }, [isActive, width, textWidth, activeWidth])

  return (
    <ReAnimatedPressable
      className="relative flex h-12 flex-row items-center justify-center gap-2 overflow-hidden rounded-[1.2rem]"
      onPress={onPress}
      style={useAnimatedStyle(() => ({
        backgroundColor: bgColor,
        width: width.value,
        ...style,
      }))}
    >
      <View
        className="flex-row items-center gap-2"
        onLayout={({ nativeEvent }) => {
          if (isActive) {
            textWidth.value = nativeEvent.layout.width
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
  scrollViewRef,
  isActive,
}: {
  view: ViewDefinition
  scrollViewRef: React.RefObject<ScrollView | null>
  isActive: boolean
}) {
  const textColor = useColor("gray")
  const unreadCount = useUnreadCountByView(view.view)
  const borderColor = useColor("gray5")
  const { t } = useTranslation("common")
  const itemRef = React.useRef<View>(null)
  const { width: windowWidth } = useWindowDimensions()

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
          onPress={() => selectTimeline({ type: "view", viewId: view.view })}
          style={isActive ? { backgroundColor: view.activeColor } : undefined}
        >
          <view.icon color={isActive ? "#fff" : textColor} height={21} width={21} />
          {isActive ? (
            <>
              <Text key={view.name} className="text-sm font-semibold text-white" numberOfLines={1}>
                {t(view.name)}
              </Text>
              <UnreadCount
                max={99}
                unread={unreadCount}
                dotClassName="size-1.5 rounded-full bg-white"
                textClassName="text-white font-bold"
              />
            </>
          ) : (
            !!unreadCount &&
            !isActive && (
              <View
                className="absolute -right-0.5 -top-0.5 size-2 rounded-full border"
                style={{ backgroundColor: textColor, borderColor }}
              />
            )
          )}
        </ItemWrapper>
      </View>
    </TimelineViewSelectorContextMenu>
  )
}
