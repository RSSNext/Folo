import { whoami } from "@follow/store/user/getters"
import { getCrashlytics, setAttributes, setUserId } from "@react-native-firebase/crashlytics"

export const initCrashlytics = async () => {
  const crashlytics = getCrashlytics()
  const user = whoami()
  if (user) {
    await Promise.all([
      setUserId(crashlytics, user.id),
      setAttributes(crashlytics, {
        email: user.email ?? "",
        name: user.name ?? "",
        handle: user.handle ?? "",
      }),
    ])
  }
}
