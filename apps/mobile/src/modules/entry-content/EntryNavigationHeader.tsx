import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import { useAtomValue } from "jotai"
import type { FC } from "react"
import { use, useEffect, useState } from "react"
import { StyleSheet, useWindowDimensions, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { useUISettingKey } from "@/src/atoms/settings/ui"
import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { DefaultHeaderBackButton } from "@/src/components/layouts/header/NavigationHeader"
import { NavigationHeaderHeightContext } from "@/src/components/layouts/views/NavigationHeaderContext"
import { NavigationBlurEffectHeaderView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"

import { useHeaderHeight } from "../screen/hooks/useHeaderHeight"
import { EntryContentContext } from "./ctx"
import { EntryContentHeaderRightActions } from "./EntryContentHeaderRightActions"
import { EntryReadHistory } from "./EntryReadHistory"

// Minimum scroll distance in one direction before the header reacts.
const AUTO_HIDE_SCROLL_THRESHOLD = 24
const AUTO_HIDE_ANIMATION = { duration: 200 }

/**
 * Slide the header away when scrolling down and bring it back when scrolling up.
 * The header always stays visible near the top of the content. While hidden, a blurred
 * strip keeps the status bar readable over the scrolling content.
 */
const useAutoHideHeader = () => {
  const autoHideReaderHeader = useUISettingKey("autoHideReaderHeader")
  const reanimatedScrollY = use(ScreenItemContext).reAnimatedScrollY
  const insets = useSafeAreaInsets()
  // Measured height of the rendered header (title bar + status bar inset).
  const headerHeight = use(NavigationHeaderHeightContext)
  const hiddenOffset = headerHeight

  const headerTranslateY = useSharedValue(0)
  const isHeaderHidden = useSharedValue(false)
  const lastScrollY = useSharedValue(0)
  const directionAnchorY = useSharedValue(0)
  const isScrollingDown = useSharedValue(false)

  useAnimatedReaction(
    () => reanimatedScrollY.value,
    (value) => {
      if (!autoHideReaderHeader) return

      const previous = lastScrollY.value
      lastScrollY.value = value

      if (value <= headerHeight) {
        directionAnchorY.value = value
        if (isHeaderHidden.value) {
          isHeaderHidden.value = false
          headerTranslateY.value = withTiming(0, AUTO_HIDE_ANIMATION)
        }
        return
      }

      const scrollingDown = value > previous
      if (scrollingDown !== isScrollingDown.value) {
        isScrollingDown.value = scrollingDown
        directionAnchorY.value = previous
      }
      if (Math.abs(value - directionAnchorY.value) < AUTO_HIDE_SCROLL_THRESHOLD) return

      if (scrollingDown !== isHeaderHidden.value) {
        isHeaderHidden.value = scrollingDown
        headerTranslateY.value = withTiming(scrollingDown ? -hiddenOffset : 0, AUTO_HIDE_ANIMATION)
      }
    },
    [autoHideReaderHeader, headerHeight, hiddenOffset],
  )

  useEffect(() => {
    if (autoHideReaderHeader) return
    isHeaderHidden.value = false
    headerTranslateY.value = withTiming(0, AUTO_HIDE_ANIMATION)
  }, [autoHideReaderHeader, headerTranslateY, isHeaderHidden])

  const headerContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerTranslateY.value }],
  }))
  const statusBarStripStyle = useAnimatedStyle(() => ({
    opacity: hiddenOffset > 0 ? interpolate(headerTranslateY.value, [-hiddenOffset, 0], [1, 0]) : 0,
  }))

  return { autoHideReaderHeader, headerContainerStyle, statusBarStripStyle, topInset: insets.top }
}

const StatusBarBlurStrip = ({
  height,
  style,
}: {
  height: number
  style: ReturnType<typeof useAnimatedStyle>
}) => {
  if (height <= 0) return null
  return (
    <Animated.View
      pointerEvents="none"
      className="absolute inset-x-0 top-0 z-[98]"
      style={[{ height }, style]}
    >
      <ThemedBlurView style={StyleSheet.absoluteFill} />
    </Animated.View>
  )
}

export const EntryNavigationHeader: FC<{
  entryId: string
}> = ({ entryId }) => {
  const opacityAnimatedValue = useSharedValue(0)

  const headerHeight = useHeaderHeight()
  const { autoHideReaderHeader, headerContainerStyle, statusBarStripStyle, topInset } =
    useAutoHideHeader()

  const title = useEntry(entryId, (entry) => {
    return entry.title
  })

  const [isHeaderTitleVisible, setIsHeaderTitleVisible] = useState(true)

  const reanimatedScrollY = use(ScreenItemContext).reAnimatedScrollY

  const ctxValue = use(EntryContentContext)
  const titleHeight = useAtomValue(ctxValue.titleHeightAtom)
  // Reacts only when the title crosses into or out of the header, not on every scroll frame
  useAnimatedReaction(
    () => reanimatedScrollY.value > titleHeight + headerHeight,
    (visible, previous) => {
      if (visible === previous) return
      opacityAnimatedValue.value = withTiming(visible ? 1 : 0, { duration: 100 })
      runOnJS(setIsHeaderTitleVisible)(visible)
    },
    [titleHeight, headerHeight],
  )
  const headerBarWidth = useWindowDimensions().width

  return (
    <>
      {autoHideReaderHeader && <StatusBarBlurStrip height={topInset} style={statusBarStripStyle} />}
      <NavigationBlurEffectHeaderView
        headerTitleAbsolute
        containerStyle={headerContainerStyle}
        headerLeft={useTypeScriptHappyCallback(
          ({ canGoBack }) => (
            <EntryLeftGroup
              canGoBack={canGoBack ?? false}
              entryId={entryId}
              titleOpacityShareValue={opacityAnimatedValue}
              isHeaderTitleVisible={isHeaderTitleVisible}
            />
          ),
          [entryId, isHeaderTitleVisible],
        )}
        headerRight={
          <EntryContentContext value={ctxValue}>
            <EntryContentHeaderRightActions
              entryId={entryId}
              titleOpacityShareValue={opacityAnimatedValue}
              isHeaderTitleVisible={isHeaderTitleVisible}
            />
          </EntryContentContext>
        }
        headerTitle={
          <View
            className="flex-row items-center justify-center"
            pointerEvents="none"
            style={{ width: headerBarWidth - 80 }}
          >
            <Animated.Text
              className={"text-center text-[17px] font-semibold text-label"}
              numberOfLines={1}
              style={{ opacity: opacityAnimatedValue }}
            >
              {title}
            </Animated.Text>
          </View>
        }
      />
    </>
  )
}
interface EntryLeftGroupProps {
  canGoBack: boolean
  entryId: string
  titleOpacityShareValue: SharedValue<number>
  isHeaderTitleVisible: boolean
}

const EntryLeftGroup = ({
  canGoBack,
  entryId,
  titleOpacityShareValue,
  isHeaderTitleVisible,
}: EntryLeftGroupProps) => {
  const hideRecentReader = useUISettingKey("hideRecentReader")
  const animatedOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(titleOpacityShareValue.value, [0, 1], [1, 0]),
    }
  })
  return (
    <View className="flex-row items-center justify-center">
      <DefaultHeaderBackButton canGoBack={canGoBack} canDismiss={false} />

      {!hideRecentReader && (
        <Animated.View
          style={animatedOpacity}
          className="absolute left-[32px] z-10 flex-row gap-2"
          // Faded out once the title shows in the header, and no longer tappable or announced
          pointerEvents={isHeaderTitleVisible ? "none" : "box-none"}
          accessibilityElementsHidden={isHeaderTitleVisible}
          importantForAccessibility={isHeaderTitleVisible ? "no-hide-descendants" : "auto"}
        >
          <EntryReadHistory entryId={entryId} />
        </Animated.View>
      )}
    </View>
  )
}
