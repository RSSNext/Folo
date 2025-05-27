import { useTypeScriptHappyCallback } from "@follow/hooks"
import { useEntry } from "@follow/store/entry/hooks"
import { useAtomValue } from "jotai"
import type { FC } from "react"
import { use, useState } from "react"
import { useWindowDimensions, View } from "react-native"
import type { SharedValue } from "react-native-reanimated"
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { useUISettingKey } from "@/src/atoms/settings/ui"
import { DefaultHeaderBackButton } from "@/src/components/layouts/header/NavigationHeader"
import { NavigationBlurEffectHeaderView } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"

import { useHeaderHeight } from "../screen/hooks/useHeaderHeight"
import { EntryContentContext } from "./ctx"
import { EntryContentHeaderRightActions } from "./EntryContentHeaderRightActions"
import { EntryReadHistory } from "./EntryReadHistory"

export const EntryNavigationHeader: FC<{
  entryId: string
}> = ({ entryId }) => {
  const opacityAnimatedValue = useSharedValue(0)

  const headerHeight = useHeaderHeight()

  const title = useEntry(entryId, (entry) => {
    return entry.title
  })

  const [isHeaderTitleVisible, setIsHeaderTitleVisible] = useState(true)

  const reanimatedScrollY = use(ScreenItemContext).reAnimatedScrollY

  const ctxValue = use(EntryContentContext)
  const titleHeight = useAtomValue(ctxValue.titleHeightAtom)
  useAnimatedReaction(
    () => reanimatedScrollY.value,
    (value) => {
      if (value > titleHeight + headerHeight) {
        opacityAnimatedValue.value = withTiming(1, { duration: 100 })
        runOnJS(setIsHeaderTitleVisible)(true)
      } else {
        opacityAnimatedValue.value = withTiming(0, { duration: 100 })
        runOnJS(setIsHeaderTitleVisible)(false)
      }
    },
  )
  const headerBarWidth = useWindowDimensions().width

  return (
    <NavigationBlurEffectHeaderView
      headerTitleAbsolute
      headerLeft={useTypeScriptHappyCallback(
        ({ canGoBack }) => (
          <EntryLeftGroup
            canGoBack={canGoBack ?? false}
            entryId={entryId}
            titleOpacityShareValue={opacityAnimatedValue}
          />
        ),
        [entryId],
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
            className={"text-label text-center text-[17px] font-semibold"}
            numberOfLines={1}
            style={{ opacity: opacityAnimatedValue }}
          >
            {title}
          </Animated.Text>
        </View>
      }
    />
  )
}
interface EntryLeftGroupProps {
  canGoBack: boolean
  entryId: string
  titleOpacityShareValue: SharedValue<number>
}

const EntryLeftGroup = ({ canGoBack, entryId, titleOpacityShareValue }: EntryLeftGroupProps) => {
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
        <Animated.View style={animatedOpacity} className="absolute left-[32px] z-10 flex-row gap-2">
          <EntryReadHistory entryId={entryId} />
        </Animated.View>
      )}
    </View>
  )
}
