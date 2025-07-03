import { parseSafeUrl, transformVideoUrl } from "@follow/utils"
import type { RefObject } from "react"
import { useCallback } from "react"
import type WebView from "react-native-webview"
import type { WebViewNavigation } from "react-native-webview"

import { openLink } from "../lib/native"

const allowHosts = new Set(["app.follow.is", "app.folo.is"])
export function useWebViewNavigation({ webViewRef }: { webViewRef: RefObject<WebView> }) {
  const onNavigationStateChange = useCallback(
    (newNavState: WebViewNavigation) => {
      const { url: urlStr } = newNavState
      const url = parseSafeUrl(urlStr)
      if (!url) return
      if (url.protocol === "file:") return
      if (allowHosts.has(url.host)) return

      webViewRef.current?.stopLoading()

      const formattedUrl = transformVideoUrl({ url: urlStr })
      if (formattedUrl) {
        openLink(formattedUrl)
        return
      }
      openLink(urlStr)
    },
    [webViewRef],
  )

  return { onNavigationStateChange }
}
