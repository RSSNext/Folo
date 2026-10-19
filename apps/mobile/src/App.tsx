import { usePrefetchActions } from "@follow/store/action/hooks"
import { usePrefetchSessionUser, useWhoami } from "@follow/store/user/hooks"
import { StatusBar } from "expo-status-bar"
import type { FC, PropsWithChildren } from "react"
import { useEffect, useRef } from "react"
import { View } from "react-native"
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated"
import { useSheet } from "react-native-sheet-transitions"

import { useBackHandler } from "./hooks/useBackHandler"
import { useIntentHandler } from "./hooks/useIntentHandler"
import { useMessaging, useUpdateMessagingToken } from "./hooks/useMessaging"
import { useOnboarding } from "./hooks/useOnboarding"
import { useUnreadCountBadge } from "./hooks/useUnreadCountBadge"
import { useAuthSessionCookieRefresh } from "./lib/auth"
import { useSyncAppColorScheme } from "./lib/color-scheme"
import { destination } from "./lib/navigation/biz/Destination"
import { DebugButton, EnvProfileIndicator } from "./modules/debug"
import { rememberSignedIn } from "./modules/login/returning-user"
import { ReviewPromptProvider } from "./modules/review-prompt/provider"

export function App({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StatusBar animated style="auto" />
      <View className="flex-1 bg-system-background">
        <SideEffect />

        <ScaleableWrapper>{children}</ScaleableWrapper>

        {__DEV__ && <DebugButton />}

        <EnvProfileIndicator />
      </View>
    </>
  )
}

const ScaleableWrapper: FC<PropsWithChildren> = ({ children }) => {
  const { scale } = useSheet()

  const style = useAnimatedStyle(() => ({
    borderRadius: interpolate(scale.value, [0.8, 0.99, 1], [0, 50, 0]),
    transform: [
      {
        scale: scale.value,
      },
    ],
  }))
  return (
    <Animated.View className="flex-1 overflow-hidden" style={style}>
      {children}
    </Animated.View>
  )
}

const SideEffect = () => {
  // Must run inside the jotai Provider so it observes the persisted UI settings store.
  useSyncAppColorScheme()
  useAuthSessionCookieRefresh()
  const sessionQuery = usePrefetchSessionUser()
  const hasHandledInitialSessionRef = useRef(false)
  useEffect(() => {
    if (hasHandledInitialSessionRef.current || !sessionQuery.isSuccess) {
      return
    }

    hasHandledInitialSessionRef.current = true
    if (!sessionQuery.data?.user) {
      destination.Login()
    }
  }, [sessionQuery.data?.user, sessionQuery.isSuccess])
  // Any signed-in user counts, the one restored from the device at launch included
  const whoamiId = useWhoami()?.id
  useEffect(() => {
    if (whoamiId) rememberSignedIn()
  }, [whoamiId])
  useUnreadCountBadge()
  useBackHandler()
  useIntentHandler()
  useOnboarding()

  // prefetch actions to detect if the user has any actions contains notifications
  usePrefetchActions()
  useUpdateMessagingToken()
  useMessaging()
  return <ReviewPromptProvider />
}
