import { OpenPanel } from "@follow/tracker/src/op"
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"

import { proxyEnv } from "./proxy-env"

export const op = new OpenPanel({
  clientId: proxyEnv.OPENPANEL_CLIENT_ID ?? "",
  apiUrl: proxyEnv.OPENPANEL_API_URL,
  headers: {
    Host: "app.follow.is",
    Origin: "https://app.follow.is",
    "User-Agent": `Folo/${nativeApplicationVersion}(${nativeBuildVersion})`,
  },
  sdkVersion: "1.0.0",
})
