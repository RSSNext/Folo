import { cn } from "@follow/utils"
import type { FC, PropsWithChildren, ReactNode } from "react"
import {
  createElement,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { LayoutChangeEvent } from "react-native"
import { StyleSheet, TouchableOpacity, View } from "react-native"
import type { AnimatedProps } from "react-native-reanimated"
import Animated, {
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import type { DefaultStyle } from "react-native-reanimated/lib/typescript/hook/commonTypes"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"
import type { ViewProps } from "react-native-svg/lib/typescript/fabric/utils"
import { useColor } from "react-native-uikit-colors"

import { CloseCuteReIcon } from "@/src/icons/close_cute_re"
import { MingcuteLeftLineIcon } from "@/src/icons/mingcute_left_line"
import {
  useCanBack,
  useCanDismiss,
  useNavigation,
  useScreenIsInSheetModal,
} from "@/src/lib/navigation/hooks"
import { ScreenItemContext } from "@/src/lib/navigation/ScreenItemContext"

import { ThemedBlurView } from "../../common/ThemedBlurView"
import { getDefaultHeaderHeight } from "../utils"
import { SetNavigationHeaderHeightContext } from "../views/NavigationHeaderContext"
import { FakeNativeHeaderTitle } from "./FakeNativeHeaderTitle"

interface NavigationHeaderButtonProps {
  canGoBack: boolean
  canDismiss: boolean
  modal?: boolean
}
export interface NavigationHeaderRawProps {
  headerLeft?: FC<NavigationHeaderButtonProps>
  headerRight?: FC<NavigationHeaderButtonProps>
  headerTitle?: FC<React.ComponentProps<typeof FakeNativeHeaderTitle>> | ReactNode
  headerTitleAbsolute?: boolean

  title?: string

  modal?: boolean
  hideableBottom?: ReactNode
  hideableBottomHeight?: number
}

const useHideableBottom = (
  enable: boolean,
  originalDefaultHeaderHeight: number,
  hideableBottomHeight?: number,
) => {
  const lastScrollY = useRef(0)

  const largeDefaultHeaderHeightRef = useRef(
    originalDefaultHeaderHeight + (hideableBottomHeight || 0),
  )
  const largeHeaderHeight = useSharedValue(largeDefaultHeaderHeightRef.current)
  const [hideableBottomRef, setHideableBottomRef] = useState<View | undefined>()

  useEffect(() => {
    hideableBottomRef?.measure((x, y, width, height) => {
      const largeHeight = height + originalDefaultHeaderHeight
      largeDefaultHeaderHeightRef.current = largeHeight
      largeHeaderHeight.value = largeHeight
    })
  }, [hideableBottomRef, largeHeaderHeight, originalDefaultHeaderHeight])

  const { reAnimatedScrollY } = useContext(ScreenItemContext)!
  useAnimatedReaction(
    () => reAnimatedScrollY.value,
    (value) => {
      if (!enable) {
        return
      }

      const largeDefaultHeaderHeight = largeDefaultHeaderHeightRef.current

      if (value <= 100) {
        largeHeaderHeight.value = withTiming(largeDefaultHeaderHeight)
      } else if (value > lastScrollY.current) {
        largeHeaderHeight.value = withTiming(originalDefaultHeaderHeight)
      } else {
        largeHeaderHeight.value = withTiming(largeDefaultHeaderHeight)
      }
      lastScrollY.current = value
    },
  )

  const layoutHeightOnceRef = useRef(false)
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      if (typeof hideableBottomHeight === "number") {
        return
      }
      const { height } = e.nativeEvent.layout

      if (!height) return
      if (layoutHeightOnceRef.current) {
        return
      }

      layoutHeightOnceRef.current = true

      largeDefaultHeaderHeightRef.current = height + originalDefaultHeaderHeight
      largeHeaderHeight.value = largeDefaultHeaderHeightRef.current
    },
    [hideableBottomHeight, largeHeaderHeight, originalDefaultHeaderHeight],
  )
  return {
    hideableBottomRef,
    setHideableBottomRef,
    largeHeaderHeight,
    largeDefaultHeaderHeightRef,
    onLayout,
  }
}
export interface InternalNavigationHeaderProps
  extends Omit<AnimatedProps<ViewProps>, "children">,
    PropsWithChildren {
  headerLeft?:
    | FC<{
        canGoBack: boolean
      }>
    | ReactNode
  headerRight?:
    | FC<{
        canGoBack: boolean
      }>
    | ReactNode
  title?: string

  hideableBottom?: ReactNode
  hideableBottomHeight?: number
  headerTitleAbsolute?: boolean
  headerTitle?: FC<React.ComponentProps<typeof FakeNativeHeaderTitle>> | ReactNode
}

const blurThreshold = 0
const titlebarPaddingHorizontal = 8
const titleMarginHorizontal = 16
export const InternalNavigationHeader = ({
  style,
  children,
  headerLeft,
  headerRight,
  title,
  headerTitle: customHeaderTitle,

  hideableBottom,
  hideableBottomHeight,
  headerTitleAbsolute,
  ...rest
}: InternalNavigationHeaderProps) => {
  const insets = useSafeAreaInsets()
  const frame = useSafeAreaFrame()

  const sheetModal = useScreenIsInSheetModal()
  const defaultHeight = useMemo(
    () => getDefaultHeaderHeight(frame, sheetModal, sheetModal ? 0 : insets.top),
    [frame, insets.top, sheetModal],
  )

  const border = useColor("opaqueSeparator")
  const opacityAnimated = useSharedValue(0)
  const { reAnimatedScrollY } = useContext(ScreenItemContext)!

  const setHeaderHeight = useContext(SetNavigationHeaderHeightContext)

  useAnimatedReaction(
    () => reAnimatedScrollY.value,
    (value) => {
      opacityAnimated.value = Math.max(0, Math.min(1, (value + blurThreshold) / 10))
    },
  )

  const canBack = useCanBack()
  const canDismiss = useCanDismiss()

  useEffect(() => {
    const { value } = reAnimatedScrollY
    opacityAnimated.value = Math.max(0, Math.min(1, (value + blurThreshold) / 10))
  }, [opacityAnimated, reAnimatedScrollY])

  const blurStyle = useAnimatedStyle(() => ({
    opacity: opacityAnimated.value,
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: border,
  }))

  const { setHideableBottomRef, largeHeaderHeight, onLayout } = useHideableBottom(
    !!hideableBottom,
    defaultHeight,
    hideableBottomHeight,
  )
  const rootTitleBarStyle = useAnimatedStyle(() => {
    const styles = {
      paddingTop: sheetModal ? 0 : insets.top,
      position: "relative",
      overflow: "hidden",
    } satisfies DefaultStyle
    if (hideableBottom) {
      ;(styles as DefaultStyle).height = largeHeaderHeight.value
    }
    return styles
  })

  const HeaderLeft = headerLeft ?? DefaultHeaderBackButton

  const renderTitle = customHeaderTitle ?? FakeNativeHeaderTitle
  const headerTitle =
    typeof renderTitle !== "function"
      ? renderTitle
      : createElement(renderTitle, {
          children: title,
        })
  const RightButton = headerRight ?? (Noop as FC<NavigationHeaderButtonProps>)

  const animatedRef = useAnimatedRef<Animated.View>()
  useLayoutEffect(() => {
    animatedRef.current?.measure((x, y, width, height) => {
      setHeaderHeight?.(height)
    })
  }, [animatedRef, setHeaderHeight])

  const leftRef = useRef<View>(null)
  const [leftWidth, setLeftWidth] = useState(0)
  useLayoutEffect(() => {
    leftRef.current?.measure((x, y, width) => {
      setLeftWidth(width)
    })
  }, [leftRef])

  const rightRef = useRef<View>(null)
  const [rightWidth, setRightWidth] = useState(0)
  useLayoutEffect(() => {
    rightRef.current?.measure((x, y, width) => {
      setRightWidth(width)
    })
  }, [rightRef])

  return (
    <Animated.View
      ref={animatedRef}
      pointerEvents={"box-none"}
      {...rest}
      style={[rootTitleBarStyle, style]}
      onLayout={useCallback(
        (e: LayoutChangeEvent) => {
          setHeaderHeight?.(e.nativeEvent.layout.height)
        },
        [setHeaderHeight],
      )}
    >
      <Animated.View style={blurStyle} pointerEvents={"none"}>
        <ThemedBlurView className="flex-1" />
      </Animated.View>

      {/* Grid */}

      <View
        className="relative flex-row items-center"
        style={{
          marginLeft: insets.left,
          marginRight: insets.right,
          height: !sheetModal ? defaultHeight - insets.top : defaultHeight,
          paddingHorizontal: titlebarPaddingHorizontal,
        }}
        pointerEvents={"box-none"}
      >
        {/* Left */}
        <View
          ref={leftRef}
          className="flex min-w-6 shrink-0 flex-row items-center justify-start"
          pointerEvents={"box-none"}
        >
          {typeof HeaderLeft === "function" ? (
            <HeaderLeft canGoBack={canBack} canDismiss={canDismiss} modal={sheetModal} />
          ) : (
            HeaderLeft
          )}
        </View>
        {/* Center */}

        <Animated.View
          className="flex min-w-0 flex-1 shrink flex-row items-center justify-center truncate"
          pointerEvents={"box-none"}
          style={{
            marginHorizontal: titleMarginHorizontal,
          }}
        >
          <View className="shrink" style={{ flexBasis: rightWidth }} />
          {headerTitleAbsolute ? <View /> : headerTitle}
          <View className="shrink" style={{ flexBasis: leftWidth }} />
        </Animated.View>

        {/* Right */}
        <View
          ref={rightRef}
          className="flex min-w-6 shrink-0 flex-row items-center justify-end"
          pointerEvents={"box-none"}
        >
          {typeof RightButton === "function" ? (
            <RightButton canGoBack={canBack} canDismiss={canDismiss} modal={sheetModal} />
          ) : (
            RightButton
          )}
        </View>
        <View
          className="absolute inset-0 flex-row items-center justify-center"
          pointerEvents={"box-none"}
        >
          {headerTitleAbsolute && headerTitle}
        </View>
      </View>

      {!!hideableBottom && (
        <View ref={setHideableBottomRef as any} onLayout={onLayout}>
          {hideableBottom}
        </View>
      )}
    </Animated.View>
  )
}

export const DefaultHeaderBackButton = ({ canGoBack, canDismiss }: NavigationHeaderButtonProps) => {
  const label = useColor("label")
  const navigation = useNavigation()
  if (!canGoBack && !canDismiss) return null
  return (
    <UINavigationHeaderActionButton
      onPress={() => {
        if (canGoBack) {
          navigation.back()
        } else if (canDismiss) {
          navigation.dismiss()
        }
      }}
    >
      {canGoBack ? (
        <MingcuteLeftLineIcon height={20} width={20} color={label} />
      ) : (
        <CloseCuteReIcon height={20} width={20} color={label} />
      )}
    </UINavigationHeaderActionButton>
  )
}

export const UINavigationHeaderActionButton = ({
  children,
  onPress,
  disabled,
  className,
}: {
  children: ReactNode
  onPress?: () => void
  disabled?: boolean
  className?: string
}) => {
  return (
    <TouchableOpacity
      hitSlop={5}
      className={cn("p-2", className)}
      onPress={onPress}
      disabled={disabled}
    >
      {children}
    </TouchableOpacity>
  )
}
const Noop = () => null
