import { getApp } from "@react-native-firebase/app"
import getAppCheck, { getLimitedUseToken } from "@react-native-firebase/app-check"

export async function getTokenHeaders() {
  const app = getApp()
  const appCheck = getAppCheck(app)
  let token = ""
  try {
    const appCheckToken = await getLimitedUseToken(appCheck)
    token = appCheckToken.token
  } catch (error) {
    console.warn("[app-check] failed to get limited-use token, fallback to synthetic token", error)
  }

  return {
    "x-token": `ac:${token || "fallback"}`,
  }
}
