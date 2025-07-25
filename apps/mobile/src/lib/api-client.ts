import { userActions } from "@follow/store/user/store"
import { createMobileAPIHeaders } from "@follow/utils/headers"
import { FollowClient } from "@follow-app/client-sdk"
import { nativeApplicationVersion } from "expo-application"
import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

import { PlanScreen } from "../modules/settings/routes/Plan"
import { getCookie } from "./auth"
import { getClientId, getSessionId } from "./client-session"
import { getUserAgent } from "./native/user-agent"
import { Navigation } from "./navigation/Navigation"
import { proxyEnv } from "./proxy-env"

export const followClient = new FollowClient({
  credentials: "omit",
  timeout: 10000,
  baseURL: proxyEnv.API_URL,
  fetch: async (input, options = {}) =>
    fetch(input.toString(), {
      ...options,
      cache: "no-store",
    }),
})

export const followApi = followClient.api
followClient.addRequestInterceptor(async (ctx) => {
  const { options } = ctx
  const header = options.headers || {}
  header["X-Client-Id"] = getClientId()
  header["X-Session-Id"] = getSessionId()
  header["User-Agent"] = await getUserAgent()
  header["cookie"] = getCookie()

  const apiHeader = createMobileAPIHeaders({
    version: nativeApplicationVersion || "",
    rnPlatform: {
      OS: Platform.OS,
      isPad: Platform.OS === "ios" && Platform.isPad,
    },
    installerPackageName: await DeviceInfo.getInstallerPackageName(),
  })

  options.headers = {
    ...header,
    ...apiHeader,
  }
  return ctx
})

followClient.addErrorInterceptor(async ({ error, response }) => {
  if (!response) {
    return error
  }

  if (response.status === 401) {
    userActions.removeCurrentUser()
  } else {
    try {
      const json = await response.json()
      console.error(`Request failed with status ${response.status}`, json)

      if (json.code.toString().startsWith("11")) {
        Navigation.rootNavigation.presentControllerView(PlanScreen)
      }
    } catch {
      console.error(`Request failed with status ${response.status}`, error)
    }
  }

  return error
})
