import { usePrefetchActions } from "@follow/store/src/action/hooks"
// import { useMessaging, useUpdateMessagingToken } from "@follow/store/src/messaging/hooks"
// import { useUnreadCountBadge } from "@follow/store/src/unread/hooks"
import { usePrefetchSessionUser } from "@follow/store/src/user/hooks"
import { StatusBar } from "expo-status-bar"
import { View } from "react-native"
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated"
import { RootSiblingParent } from "react-native-root-siblings"
import { useSheet } from "react-native-sheet-transitions"

import { useBackHandler } from "./hooks/useBackHandler"
import { useIntentHandler } from "./hooks/useIntentHandler"
import { DebugButton, EnvProfileIndicator } from "./modules/debug"

export function App({ children }: { children: React.ReactNode }) {
  useIntentHandler()
  // FIXME:
  // useOnboarding()
  // useUnreadCountBadge()
  useBackHandler()

  // prefetch actions to detect if the user has any actions contains notifications
  usePrefetchActions()
  // useUpdateMessagingToken()
  // useMessaging()
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
