import { whoami } from "@follow/store/user/getters"
import { setFirebaseTracker, setPostHogTracker, tracker } from "@follow/tracker"
import { getAnalytics } from "@react-native-firebase/analytics"
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"
import PostHog from "posthog-react-native"

import { proxyEnv } from "../lib/proxy-env"

export const initAnalytics = async () => {
  setFirebaseTracker(getAnalytics())

  const user = whoami()
  if (user) {
    tracker.identify(user)
  }

  tracker.manager.appendUserProperties({
    build: "rn",
    version: nativeApplicationVersion,
    buildId: nativeBuildVersion,
  })

  if (proxyEnv.POSTHOG_KEY) {
    setPostHogTracker(new PostHog(proxyEnv.POSTHOG_KEY))
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
