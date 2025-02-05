import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { Header, useHeaderHeight } from "@react-navigation/elements"
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack"
import { router, Stack, useNavigation } from "expo-router"
import type { FC, PropsWithChildren } from "react"
import { createContext, useContext, useEffect, useMemo, useRef } from "react"
import type { ScrollViewProps } from "react-native"
import {
  Animated as RNAnimated,
  StyleSheet,
  TouchableOpacity,
  useAnimatedValue,
  View,
} from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated"
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import { useDefaultHeaderHeight } from "@/src/hooks/useDefaultHeaderHeight"
import { MingcuteLeftLineIcon } from "@/src/icons/mingcute_left_line"

import { AnimatedScrollView } from "./AnimatedComponents"
import { ThemedBlurView } from "./ThemedBlurView"

type SafeNavigationScrollViewProps = Omit<ScrollViewProps, "onScroll"> & {
  withHeaderBlur?: boolean
  onScroll?: (e: ReanimatedScrollEvent) => void

  // For scroll view content adjustment behavior
  withTopInset?: boolean
  withBottomInset?: boolean
} & PropsWithChildren
export const NavigationContext = createContext<{
  scrollY: RNAnimated.Value
} | null>(null)

export const SafeNavigationScrollView: FC<SafeNavigationScrollViewProps> = ({
  children,

  withHeaderBlur = true,
  onScroll,

  withBottomInset = false,
  withTopInset = false,

  ...props
}) => {
  const insets = useSafeAreaInsets()
  const tabBarHeight = useBottomTabBarHeight()
  const headerHeight = useHeaderHeight()

  const scrollY = useAnimatedValue(0)

  return (
    <NavigationContext.Provider value={useMemo(() => ({ scrollY }), [scrollY])}>
      {withHeaderBlur && <NavigationBlurEffectHeader />}
      <AnimatedScrollView
        onScroll={RNAnimated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        {...props}
      >
        <View style={{ height: headerHeight - (withTopInset ? insets.top : 0) }} />
        <View>{children}</View>
        <View style={{ height: tabBarHeight - (withBottomInset ? insets.bottom : 0) }} />
      </AnimatedScrollView>
    </NavigationContext.Provider>
  )
}

export const NavigationBlurEffectHeader = ({
  blurThreshold = 0,
  headerHideableBottomHeight = 50,
  headerHideableBottom,
  ...props
}: NativeStackNavigationOptions & {
  blurThreshold?: number
  headerHideableBottomHeight?: number
  headerHideableBottom?: () => React.ReactNode
}) => {
  const label = useColor("label")

  const canBack = useNavigation().canGoBack()

  const { scrollY } = useContext(NavigationContext)!

  const border = useColor("opaqueSeparator")

  const opacityAnimated = useSharedValue(0)

  const originalDefaultHeaderHeight = useDefaultHeaderHeight()
  const largeDefaultHeaderHeight = originalDefaultHeaderHeight + headerHideableBottomHeight

  const largeHeaderHeight = useSharedValue(largeDefaultHeaderHeight)

  const lastScrollY = useRef(0)

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      opacityAnimated.value = Math.max(0, Math.min(1, (value + blurThreshold) / 10))
      if (headerHideableBottom && value > 0) {
        if (value > lastScrollY.current) {
          largeHeaderHeight.value = withTiming(originalDefaultHeaderHeight)
        } else {
          largeHeaderHeight.value = withTiming(largeDefaultHeaderHeight)
        }
        lastScrollY.current = value
      }
    })

    return () => {
      scrollY.removeListener(id)
    }
  }, [
    blurThreshold,
    scrollY,
    headerHideableBottom,
    largeHeaderHeight,
    originalDefaultHeaderHeight,
    largeDefaultHeaderHeight,
    opacityAnimated,
  ])

  const style = useAnimatedStyle(() => ({
    opacity: opacityAnimated.value,
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: border,
  }))

  const hideableBottom = headerHideableBottom?.()

  return (
    <Stack.Screen
      options={{
        headerBackground: () => (
          <Animated.View style={style}>
            <ThemedBlurView className="flex-1" />
          </Animated.View>
        ),
        headerTransparent: true,

        headerLeft: canBack
          ? () => (
              <TouchableOpacity hitSlop={10} onPress={() => router.back()}>
                <MingcuteLeftLineIcon height={20} width={20} color={label} />
              </TouchableOpacity>
            )
          : undefined,

        header: headerHideableBottom
          ? ({ options }) => {
              return (
                <Animated.View style={{ height: largeHeaderHeight }} className="overflow-hidden">
                  <View pointerEvents="box-none" style={[StyleSheet.absoluteFill]}>
                    {options.headerBackground?.()}
                  </View>
                  <Header title={options.title ?? ""} {...options} headerBackground={() => null} />
                  {hideableBottom}
                </Animated.View>
              )
            }
          : undefined,

        ...props,
      }}
    />
  )
}
