import { identifyUserOpenPanel, setOpenPanelTracker } from "@follow/tracker"
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"

import { op } from "../lib/op"
import { whoami } from "../store/user/getters"

export const initAnalytics = () => {
  setOpenPanelTracker(op.track.bind(op))
  const user = whoami()
  if (user) {
    identifyUserOpenPanel(user, op.identify.bind(op))
  }

  op.setGlobalProperties({
    build: "rn",
    version: nativeApplicationVersion,
    buildId: nativeBuildVersion,
  })
}
