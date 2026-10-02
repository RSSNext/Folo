import { whoami } from "@follow/store/user/getters"
import {
  createPostHogBeforeSend,
  setFirebaseTracker,
  setPostHogTracker,
  tracker,
} from "@follow/tracker"
import type { AuthUser } from "@follow-app/client-sdk"
import {
  getAnalytics,
  logEvent,
  setUserId,
  setUserProperties,
} from "@react-native-firebase/analytics"
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"
import PostHog from "posthog-react-native"

import { proxyEnv } from "../lib/proxy-env"

export const initAnalytics = async () => {
  const analytics = getAnalytics()
  setFirebaseTracker({
    logEvent: (name, properties) => logEvent(analytics, name, properties),
    setUserId: (id) => setUserId(analytics, id),
    setUserProperties: (properties) => setUserProperties(analytics, properties),
  })

  if (proxyEnv.POSTHOG_KEY) {
    setPostHogTracker(
      new PostHog(proxyEnv.POSTHOG_KEY, {
        host: proxyEnv.POSTHOG_HOST,
        before_send: createPostHogBeforeSend(),
        errorTracking: {
          autocapture: {
            uncaughtExceptions: true,
            unhandledRejections: true,
            console: false,
          },
        },
      }),
    )
  }

  tracker.manager.appendUserProperties({
    build: "rn",
    version: nativeApplicationVersion,
    buildId: nativeBuildVersion,
  })

  const user = whoami()
  if (user) {
    tracker.identify(user as AuthUser)
  }
}
