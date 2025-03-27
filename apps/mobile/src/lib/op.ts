import { OpenPanel } from "@follow/tracker/src/op"

import { getUserAgent } from "./native/user-agent"
import { proxyEnv } from "./proxy-env"

export const op = new OpenPanel({
  clientId: proxyEnv.OPENPANEL_CLIENT_ID ?? "",
  apiUrl: proxyEnv.OPENPANEL_API_URL,
  headers: {
    Origin: "https://app.follow.is",
  },
  sdk: "react-native",
  sdkVersion: "1.0.0",
})

getUserAgent().then((userAgent) => {
  op.setHeaders({
    "User-Agent": userAgent,
  })
})
