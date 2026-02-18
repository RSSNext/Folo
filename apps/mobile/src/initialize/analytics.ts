import { whoami } from "@follow/store/user/getters"
import { setFirebaseTracker, setPostHogTracker, tracker } from "@follow/tracker"
import type { AuthUser } from "@follow-app/client-sdk"
import { getAnalytics } from "@react-native-firebase/analytics"
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"
import PostHog from "posthog-react-native"

import { proxyEnv } from "../lib/proxy-env"

export const initAnalytics = async () => {
  setFirebaseTracker(getAnalytics())

  if (proxyEnv.POSTHOG_KEY) {
    setPostHogTracker(
      new PostHog(proxyEnv.POSTHOG_KEY, {
        host: proxyEnv.POSTHOG_HOST,
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

  // op.setGlobalProperties({
  //   build: "rn",
  //   version: nativeApplicationVersion,
  //   buildId: nativeBuildVersion,
  // })

  // op.setHeaders({
  //   "User-Agent": await getUserAgent(),
  // })
}
