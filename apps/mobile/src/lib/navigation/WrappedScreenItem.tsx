import { isUndefined } from "es-toolkit/compat"
import type { PrimitiveAtom } from "jotai"
import { atom, useAtomValue, useSetAtom } from "jotai"
import type { FC, ReactNode } from "react"
import { memo, use, useCallback, useMemo, useRef } from "react"
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from "react-native"
import { StyleSheet, View } from "react-native"
import { useSharedValue } from "react-native-reanimated"
import type { ScreenStackHeaderConfigProps, StackPresentationTypes } from "react-native-screens"
import {
  ScreenStackHeaderCenterView,
  ScreenStackHeaderLeftView,
  ScreenStackHeaderRightView,
  ScreenStackItem,
} from "react-native-screens"

import { ErrorBoundary } from "@/src/components/common/ErrorBoundary"
import { ScreenErrorScreen } from "@/src/components/errors/ScreenErrorScreen"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { useColor } from "@/src/theme/colors"

import { useCombinedLifecycleEvents } from "./__internal/hooks"
import { defaultHeaderConfig } from "./config"
import type { ScreenItemContextType } from "./ScreenItemContext"
import { ScreenItemContext } from "./ScreenItemContext"
import type { ScreenOptionsContextType } from "./ScreenOptionsContext"
import { ScreenOptionsContext } from "./ScreenOptionsContext"
import type { NavigationControllerViewExtraProps } from "./types"

export const WrappedScreenItem: FC<
  {
    screenId: string
    children: React.ReactNode
    stackPresentation?: StackPresentationTypes

    headerConfig?: ScreenStackHeaderConfigProps
    screenOptions?: NavigationControllerViewExtraProps
    style?: StyleProp<ViewStyle>
  } & ScreenOptionsContextType
> = memo(
  ({
    screenId,
    children,
    stackPresentation,
    headerConfig,
    screenOptions: screenOptionsProp,
    style,
    ...rest
  }) => {
    const navigation = useNavigation()
    const reAnimatedScrollY = useSharedValue(0)
    const scrollViewHeight = useSharedValue(0)
    const scrollViewContentHeight = useSharedValue(0)
    const ctxValue = useMemo<ScreenItemContextType>(
      () => ({
        screenId,
        isFocusedAtom: atom(false),
        isAppearedAtom: atom(false),
        isDisappearedAtom: atom(false),
        reAnimatedScrollY,
        Slot: atom<{
          header: ReactNode
        }>({
          header: null,
        }),
        scrollViewHeight,
        scrollViewContentHeight,
      }),
      [screenId, reAnimatedScrollY, scrollViewHeight, scrollViewContentHeight],
    )
    const setIsFocused = useSetAtom(ctxValue.isFocusedAtom)
    const setIsAppeared = useSetAtom(ctxValue.isAppearedAtom)
    const setIsDisappeared = useSetAtom(ctxValue.isDisappearedAtom)

    const combinedLifecycleEvents = useCombinedLifecycleEvents(ctxValue.screenId, {
      onAppear: () => {
        setIsFocused(true)
        setIsAppeared(true)
        setIsDisappeared(false)
      },
      onDisappear: () => {
        setIsFocused(false)
        setIsAppeared(false)
        setIsDisappeared(true)
      },
      onWillAppear: () => {
        setIsFocused(false)
        setIsAppeared(true)
        setIsDisappeared(false)
      },
      onWillDisappear: () => {
        setIsFocused(false)
        setIsAppeared(false)
        setIsDisappeared(true)
      },
    }) as any

    const screenOptionsCtxValue = useMemo<PrimitiveAtom<ScreenOptionsContextType>>(
      () => atom({}),
      [],
    )

    const screenOptionsFromCtx = useAtomValue(screenOptionsCtxValue)

    const backgroundColor = useColor("systemBackground")

    const handleDismiss = useCallback(
      (
        e: NativeSyntheticEvent<{
          dismissCount: number
        }>,
      ) => {
        if (e.nativeEvent.dismissCount > 0) {
          for (let i = 0; i < e.nativeEvent.dismissCount; i++) {
            navigation.__internal_dismiss(screenId)
          }
        }
      },
      [navigation, screenId],
    )

    const ref = useRef<View>(null)

    return (
      <ScreenItemContext value={ctxValue}>
        <ScreenOptionsContext value={screenOptionsCtxValue}>
          <ScreenStackItem
            {...combinedLifecycleEvents}
            headerConfig={{
              ...defaultHeaderConfig,
              ...headerConfig,
            }}
            key={screenId}
            screenId={screenId}
            ref={ref}
            stackPresentation={stackPresentation}
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: screenOptionsProp?.transparent ? undefined : backgroundColor },
              style,
            ]}
            // Priority: Ctx > Define on Component
            {...rest}
            {...screenOptionsProp}
            {...resolveScreenOptions(screenOptionsFromCtx)}
            onDismissed={handleDismiss}
            onNativeDismissCancelled={handleDismiss}
          >
            <Header />
            <ErrorBoundary fallbackRender={ScreenErrorScreen}>{children}</ErrorBoundary>
          </ScreenStackItem>
        </ScreenOptionsContext>
      </ScreenItemContext>
    )
  },
)
const Header = () => {
  const ctxValue = use(ScreenItemContext)

  const Slot = useAtomValue(ctxValue.Slot)

  if (!Slot.header) {
    return null
  }
  return <View className="absolute inset-x-0 top-0 z-10">{Slot.header}</View>
}

WrappedScreenItem.displayName = "WrappedScreenItem"

type ExtractFC<T> = T extends FC<infer P> ? P : never
const resolveScreenOptions = (
  options: ScreenOptionsContextType,
): Partial<ExtractFC<typeof ScreenStackItem>> => {
  const headerConfig = {
    ...defaultHeaderConfig,
  }

  if (options.nativeHeader) {
    headerConfig.hidden = false
    headerConfig.translucent = true
    headerConfig.blurEffect = "systemChromeMaterial"
    headerConfig.backgroundColor = "rgba(255, 255, 255, 0)"

    const headerAeras = [] as ReactNode[]
    if (options.headerLeftArea) {
      headerAeras[0] = options.headerLeftArea
    }
    if (options.headerRightArea) {
      headerAeras[2] = options.headerRightArea
    }
    if (options.headerTitleArea) {
      headerAeras[1] = options.headerTitleArea
    }

    if (headerAeras.length > 0) {
      headerConfig.children = (
        <>
          {!!headerAeras[0] && (
            <ScreenStackHeaderLeftView>{headerAeras[0]}</ScreenStackHeaderLeftView>
          )}
          {!!headerAeras[1] && (
            <ScreenStackHeaderCenterView>{headerAeras[1]}</ScreenStackHeaderCenterView>
          )}
          {!!headerAeras[2] && (
            <ScreenStackHeaderRightView>{headerAeras[2]}</ScreenStackHeaderRightView>
          )}
        </>
      )
    }
  }

  const finalConfig: Partial<ExtractFC<typeof ScreenStackItem>> = {
    headerConfig,
  }

  if (!isUndefined(options.preventNativeDismiss)) {
    finalConfig.preventNativeDismiss = options.preventNativeDismiss
  }

  if (!isUndefined(options.gestureEnabled)) {
    finalConfig.gestureEnabled = options.gestureEnabled
  }

  return finalConfig
}
