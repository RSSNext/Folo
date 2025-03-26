import { createBuildSafeHeaders } from "@follow/utils/src/headers"
import { getImageProxyUrl, IMAGE_PROXY_URL } from "@follow/utils/src/img-proxy"
import type { ImageProps } from "expo-image"

import { proxyEnv } from "@/src/lib/proxy-env"

const buildSafeHeaders = createBuildSafeHeaders(proxyEnv.WEB_URL, [
  IMAGE_PROXY_URL,
  proxyEnv.API_URL,
])

export const getAllSources = (
  source: ImageProps["source"],
  proxy?: {
    width?: number
    height?: number
  },
) => {
  const safeSource: ImageProps["source"] = (() => {
    return source?.uri
      ? {
          ...source,
          headers: {
            ...buildSafeHeaders({ url: source.uri }),
            ...source.headers,
          },
        }
      : undefined
  })()

  const proxiesSafeSource = (() => {
    if (!proxy?.height && !proxy?.width) {
      return safeSource
    }
    return safeSource
      ? {
          ...safeSource,
          uri: getImageProxyUrl({
            url: safeSource.uri,
            width: proxy?.width ? proxy?.width * 3 : undefined,
            height: proxy?.height ? proxy?.height * 3 : undefined,
          }),
        }
      : undefined
  })()

  return [safeSource, proxiesSafeSource]
}
