import { usePrefetchActions } from "@follow/store/action/hooks"
import { usePrefetchSessionUser } from "@follow/store/user/hooks"
import { StatusBar } from "expo-status-bar"
import { View } from "react-native"
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated"
import { RootSiblingParent } from "react-native-root-siblings"
import { useSheet } from "react-native-sheet-transitions"

import { useBackHandler } from "./hooks/useBackHandler"
import { useIntentHandler } from "./hooks/useIntentHandler"
import { useMessaging, useUpdateMessagingToken } from "./hooks/useMessaging"
import { useOnboarding } from "./hooks/useOnboarding"
import { useUnreadCountBadge } from "./hooks/useUnreadCountBadge"
import { DebugButton, EnvProfileIndicator } from "./modules/debug"

export function App({ children }: { children: React.ReactNode }) {
  useIntentHandler()
  useOnboarding()
  useUnreadCountBadge()
  useBackHandler()

  // prefetch actions to detect if the user has any actions contains notifications
  usePrefetchActions()
  useUpdateMessagingToken()
  useMessaging()
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
    <>
      <StatusBar translucent animated style="auto" />
      <View className="flex-1 bg-black">
        <Session />

        <Animated.View className="flex-1 overflow-hidden" style={style}>
          <RootSiblingParent>{children}</RootSiblingParent>
        </Animated.View>
        {__DEV__ && <DebugButton />}

        <EnvProfileIndicator />
      </View>
    </>
  )
}

const Session = () => {
  usePrefetchSessionUser()
  return null
}
