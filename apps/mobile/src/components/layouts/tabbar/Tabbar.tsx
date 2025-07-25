import { useAtom, useAtomValue } from "jotai"
import type { FC } from "react"
import { memo, use, useCallback, useEffect, useMemo } from "react"
import type { StyleProp, TextStyle } from "react-native"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useEventCallback } from "usehooks-ts"

import { SetBottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"
import { gentleSpringPreset, quickSpringPreset, softSpringPreset } from "@/src/constants/spring"
import { BottomTabContext } from "@/src/lib/navigation/bottom-tab/BottomTabContext"
import type { TabbarIconProps, TabScreenProps } from "@/src/lib/navigation/bottom-tab/types"
import { isAndroid } from "@/src/lib/platform"
import { PlayerTabBar } from "@/src/modules/player/PlayerTabBar"
import { accentColor } from "@/src/theme/colors"

import { ThemedBlurView } from "../../common/ThemedBlurView"
import { Grid } from "../../ui/grid"
import { BottomTabBarBackgroundContext } from "./contexts/BottomTabBarBackgroundContext"
import { BottomTabBarVisibleContext } from "./contexts/BottomTabBarVisibleContext"

export const Tabbar: FC<{
  onPress?: (index: number) => void
}> = ({ onPress: onPressProp }) => {
  const setTabBarHeight = use(SetBottomTabBarHeightContext)
  const insets = useSafeAreaInsets()
  const tabBarVisible = use(BottomTabBarVisibleContext)
  const tabContext = use(BottomTabContext)
  const tabScreens = useAtomValue(tabContext.tabScreensAtom)
  const [selectedIndex, setSelectedIndex] = useAtom(tabContext.currentIndexAtom)
  const translateY = useSharedValue(0)
  useEffect(() => {
    cancelAnimation(translateY)
    translateY.value = withSpring(
      tabBarVisible ? 0 : 100,
      !tabBarVisible ? quickSpringPreset : softSpringPreset,
    )
  }, [tabBarVisible, translateY])
  const placeholderTabScreens = useMemo<TabScreenProps[]>(() => {
    return [
      {
        tabScreenIndex: 0,
        title: "",
        renderIcon: () => <View className="size-5" />,
        identifier: "placeholder",
      },
    ]
  }, [])
  const renderTabScreens = tabScreens.length > 0 ? tabScreens : placeholderTabScreens
  const onPress = useEventCallback((index: number) => {
    setSelectedIndex(index)
    onPressProp?.(index)
  })
  return (
    <Animated.View
      pointerEvents={tabScreens.length > 0 ? "auto" : "none"}
      accessibilityRole="tablist"
      className="absolute inset-x-0 bottom-0"
      style={{
        paddingBottom: Math.max(insets.bottom, 8),
        transform: [
          {
            translateY,
          },
        ],
      }}
      onLayout={(e) => {
        const tabBarHeight = e.nativeEvent.layout.height + (isAndroid ? insets.bottom : 0)
        setTabBarHeight(tabBarHeight)
      }}
    >
      <TabBarBackground />

      <PlayerTabBar />
      <Grid columns={renderTabScreens.length} gap={10} className="mt-[7]">
        {renderTabScreens.map((route, index) => {
          const focused = index === selectedIndex
          const label = route.title
          return (
            <MemoedTabItem
              key={route.tabScreenIndex}
              focused={focused}
              index={index}
              label={label}
              renderIcon={route.renderIcon}
              onPress={onPress}
            />
          )
        })}
      </Grid>
    </Animated.View>
  )
}
const MemoedTabItem: FC<{
  focused: boolean
  index: number
  label: string
  renderIcon?: (options: TabbarIconProps) => React.ReactNode
  onPress: (index: number) => void
}> = memo(({ focused, index, label, renderIcon: renderIconFn, onPress: onPressProp }) => {
  const inactiveTintColor = "#999"
  const onPress = () => {
    onPressProp?.(index)
  }
  const accessibilityLabel =
    typeof label === "string" && Platform.OS === "ios" ? `${label}, tab` : undefined
  const renderIcon = useCallback(
    ({ focused }: { focused: boolean }) => {
      const iconSize = ICON_SIZE_ROUND
      return (
        <TabIcon
          focused={focused}
          iconSize={iconSize}
          inactiveTintColor={inactiveTintColor}
          renderIcon={renderIconFn || noop}
        />
      )
    },
    [renderIconFn],
  )
  const renderLabel = useCallback(
    ({ focused }: { focused: boolean }) => {
      return (
        <TextLabel
          focused={focused}
          accessibilityLabel={accessibilityLabel}
          label={label}
          inactiveTintColor={inactiveTintColor}
          style={styles.labelBeneath}
        />
      )
    },
    [label, accessibilityLabel, inactiveTintColor],
  )
  return (
    <TabItem
      focused={focused}
      onPress={onPress}
      originalRenderIcon={renderIcon}
      originalRenderLabel={renderLabel}
      accessibilityLabel={accessibilityLabel}
    />
  )
})
const TextLabel = (props: {
  focused: boolean
  accessibilityLabel: string | undefined
  label: string
  inactiveTintColor: string
  style: StyleProp<TextStyle>
}) => {
  const { focused, accessibilityLabel, label, inactiveTintColor, style } = props
  return (
    <Text
      numberOfLines={1}
      accessibilityLabel={accessibilityLabel}
      style={StyleSheet.flatten([
        style,
        {
          color: focused ? accentColor : inactiveTintColor,
        },
      ])}
      allowFontScaling
    >
      {label}
    </Text>
  )
}
const TabIcon = ({
  focused,
  iconSize,
  inactiveTintColor,
  renderIcon,
}: {
  focused: boolean
  iconSize: number
  inactiveTintColor: string
  renderIcon: (options: TabbarIconProps) => React.ReactNode
}) => {
  const activeOpacity = focused ? 1 : 0
  const inactiveOpacity = focused ? 0 : 1
  return (
    <View style={styles.wrapperUikit}>
      {focused && (
        <Animated.View
          style={[
            styles.icon,
            {
              opacity: activeOpacity,
            },
          ]}
        >
          {renderIcon({
            focused: true,
            size: iconSize,
            color: accentColor,
          })}
        </Animated.View>
      )}
      {!focused && (
        <Animated.View
          style={[
            styles.icon,
            {
              opacity: inactiveOpacity,
            },
          ]}
        >
          {renderIcon({
            focused: false,
            size: iconSize,
            color: inactiveTintColor,
          })}
        </Animated.View>
      )}
    </View>
  )
}

// @copy node_modules/@react-navigation/bottom-tabs/src/views/TabBarIcon.tsx
const ICON_SIZE_WIDE = 31
const ICON_SIZE_TALL = 28
const ICON_SIZE_ROUND = 25
const styles = StyleSheet.create({
  labelBeneath: {
    fontSize: 10,
  },
  blurEffect: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  icon: {
    // We render the icon twice at the same position on top of each other:
    // active and inactive one, so we can fade between them:
    // Cover the whole iconContainer:
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    width: "100%",
  },
  wrapperUikit: {
    width: ICON_SIZE_WIDE,
    height: ICON_SIZE_TALL,
  },
})
const TabBarBackground = () => {
  const { opacity } = use(BottomTabBarBackgroundContext)
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    ...styles.blurEffect,
  }))
  const separatorStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))
  return (
    <View style={styles.blurEffect}>
      <Animated.View style={[styles.blurEffect, animatedStyle]}>
        <ThemedBlurView style={styles.blurEffect} />
      </Animated.View>
      <Animated.View
        className="bg-opaque-separator/50 absolute top-0 w-full"
        style={[
          separatorStyle,
          {
            height: StyleSheet.hairlineWidth,
          },
        ]}
      />
    </View>
  )
}
const TabItem = memo(
  ({
    focused,
    onPress,
    originalRenderIcon,
    originalRenderLabel,
    accessibilityLabel,
  }: {
    focused: boolean
    onPress: () => void
    originalRenderIcon: (scene: { focused: boolean }) => React.ReactNode
    originalRenderLabel: (scene: { focused: boolean }) => React.ReactNode
    accessibilityLabel?: string
  }) => {
    const pressed = useSharedValue(0)
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            scale: 1 - 0.15 * pressed.value,
          },
        ],
      }
    })
    const scene = {
      focused,
    }
    return (
      <Pressable
        onPress={() => {
          onPress()
          cancelAnimation(pressed)
          pressed.value = withSpring(0, quickSpringPreset)
        }}
        onPressIn={() => {
          pressed.value = withSpring(1, gentleSpringPreset)
        }}
        onPressOut={() => {
          cancelAnimation(pressed)
          pressed.value = withSpring(0, quickSpringPreset)
        }}
        className="flex-1 flex-col items-center justify-center"
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        accessibilityState={{
          selected: focused,
        }}
      >
        <Animated.View style={animatedStyle}>
          {useMemo(() => {
            return originalRenderIcon(scene)
          }, [JSON.stringify(scene), originalRenderIcon])}
        </Animated.View>
        {originalRenderLabel(scene)}
      </Pressable>
    )
  },
)
const noop = () => null
