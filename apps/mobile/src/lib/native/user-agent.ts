import { nativeApplicationVersion, nativeBuildVersion } from "expo-application"
import Constants from "expo-constants"

const expoUserAgentPromise = Constants.getWebViewUserAgentAsync()

export const getUserAgent = async () => {
  const expoUserAgent = await expoUserAgentPromise
  return `${expoUserAgent ? `${expoUserAgent} ` : ""}Folo/${nativeApplicationVersion}.${nativeBuildVersion}`
}
