import { createBuildSafeHeaders } from "@follow/utils/src/headers"
import { getImageProxyUrl, IMAGE_PROXY_URL } from "@follow/utils/src/img-proxy"
import type { ImageProps, ImageSource } from "expo-image"

import { proxyEnv } from "@/src/lib/proxy-env"

const buildSafeHeaders = createBuildSafeHeaders(proxyEnv.WEB_URL, [
  IMAGE_PROXY_URL,
  proxyEnv.API_URL,
])

// Type guard to check if source is an ImageSource with uri property
function isImageSourceWithUri(
  source: ImageProps["source"],
): source is ImageSource & { uri: string } {
  return (
    source !== null &&
    typeof source === "object" &&
    !Array.isArray(source) &&
    "uri" in source &&
    typeof source.uri === "string"
  )
}

export const getAllSources = (
  source: ImageProps["source"],
  proxy?: {
    width?: number
    height?: number
  },
) => {
  if (!isImageSourceWithUri(source)) {
    return [undefined, undefined]
  }

  // Now TypeScript knows source has a uri property
  source.uri = source.uri.replace("http://", "https://")

  const safeSource: ImageProps["source"] = {
    ...source,
    headers: {
      ...buildSafeHeaders({ url: source.uri }),
      ...source.headers,
    },
  }

  const proxiesSafeSource = (() => {
    if (!proxy?.height && !proxy?.width) {
      return safeSource
    }

    return {
      ...safeSource,
      uri: getImageProxyUrl({
        url: source.uri,
        width: proxy?.width ? proxy?.width * 3 : undefined,
        height: proxy?.height ? proxy?.height * 3 : undefined,
      }),
    }
  })()

  return [safeSource, proxiesSafeSource]
}
