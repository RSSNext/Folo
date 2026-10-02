import { env } from "@follow/shared/env.rn"
import { getApp } from "@react-native-firebase/app"
import type { AppCheck } from "@react-native-firebase/app-check"
import {
  initializeAppCheck as firebaseInitializeAppCheck,
  ReactNativeFirebaseAppCheckProvider,
} from "@react-native-firebase/app-check"

let appCheck: AppCheck | undefined

export function initializeAppCheck(): AppCheck {
  if (appCheck) return appCheck

  const provider = new ReactNativeFirebaseAppCheckProvider()
  provider.configure({
    apple: {
      provider: __DEV__ ? "debug" : "appAttest",
      debugToken: env.APP_CHECK_DEBUG_TOKEN,
    },
    android: {
      provider: __DEV__ ? "debug" : "playIntegrity",
      debugToken: env.APP_CHECK_DEBUG_TOKEN,
    },
  })

  // Firebase v26 returns the shared instance synchronously; native provider setup
  // continues in the background. Token requests handle its not-ready response.
  appCheck = firebaseInitializeAppCheck(getApp(), {
    provider,
    isTokenAutoRefreshEnabled: true,
  })
  return appCheck
}
