import { getLimitedUseToken } from "@react-native-firebase/app-check"

import { initializeAppCheck } from "../initialize/app-check"
import { getAppCheckTokenWhenReady } from "./app-check-token"

export async function getTokenHeaders() {
  let token = ""
  try {
    const appCheckToken = await getAppCheckTokenWhenReady(() =>
      getLimitedUseToken(initializeAppCheck()),
    )
    token = appCheckToken.token
  } catch (error) {
    console.warn("[app-check] failed to get limited-use token, fallback to synthetic token", error)
  }

  return {
    "x-token": `ac:${token || "fallback"}`,
  }
}
