import crashlytics from "@react-native-firebase/crashlytics"

import { whoami } from "../store/user/getters"

export const initCrashlytics = async () => {
  const user = whoami()
  if (user) {
    await Promise.all([
      crashlytics().setUserId(user.id),
      crashlytics().setAttributes({
        email: user.email ?? "",
        name: user.name ?? "",
        handle: user.handle ?? "",
      }),
    ])
  }

  crashlytics().log("User signed in.")
}
