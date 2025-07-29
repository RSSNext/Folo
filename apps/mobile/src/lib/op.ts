import { OpenPanel } from "@follow/tracker/src/op"

import { proxyEnv } from "./proxy-env"

export const op = new OpenPanel({
  clientId: proxyEnv.OPENPANEL_CLIENT_ID ?? "",
  apiUrl: proxyEnv.OPENPANEL_API_URL,
  headers: {
    Origin: "https://app.folo.is",
  },
  sdk: "react-native",
  sdkVersion: "1.0.0",
})
