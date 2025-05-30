import { whoami } from "@follow/store/user/getters"
import { setFirebaseTracker, setOpenPanelTracker, tracker } from "@follow/tracker"
import { getAnalytics } from "@react-native-firebase/analytics"
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"

import { getUserAgent } from "../lib/native/user-agent"
import { op } from "../lib/op"

export const initAnalytics = async () => {
  setOpenPanelTracker(op)
  setFirebaseTracker(getAnalytics())

  const user = whoami()
  if (user) {
    tracker.identify(user)
  }

  op.setGlobalProperties({
    build: "rn",
    version: nativeApplicationVersion,
    buildId: nativeBuildVersion,
  })

  op.setHeaders({
    "User-Agent": await getUserAgent(),
  })
}
