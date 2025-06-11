import { jotaiStore } from "@follow/utils"
import { atom } from "jotai"
import type * as React from "react"
import type { RefObject } from "react"
import { useCallback, useRef } from "react"
import type { ViewProps } from "react-native"
import { runOnJS, runOnUI } from "react-native-reanimated"
import type { WebViewNavigation } from "react-native-webview"
import WebView from "react-native-webview"

import { openLink } from "@/src/lib/native"

import { useLightboxControls } from "../../lightbox/lightboxState"
import { htmlUrl } from "./constants"
import { atEnd, atStart } from "./injected-js"

const webviewAtom = atom<WebView | null>(null)

const setWebview = (webview: WebView | null) => {
  jotaiStore.set(webviewAtom, webview)
}

export const injectJavaScript = (js: string) => {
  const webview = jotaiStore.get(webviewAtom)
  if (!webview) {
    console.warn("WebView not ready, injecting JavaScript failed", js)
    return
  }
  return webview.injectJavaScript(js)
}

const onLoadEnd = () => {
  injectJavaScript(atEnd)
}

export const NativeWebView: React.ComponentType<
  ViewProps & {
    onContentHeightChange?: (e: { nativeEvent: { height: number } }) => void
    url?: string
  }
> = ({ onContentHeightChange }) => {
  const webViewRef = useRef<WebView | null>(null)
  const { onNavigationStateChange } = useWebViewNavigation({ webViewRef })
  const { openLightbox } = useLightboxControls()

  return (
    <WebView
      ref={(webview) => {
        setWebview(webview)
      }}
      style={styles.webview}
      containerStyle={styles.webviewContainer}
      source={{ uri: htmlUrl }}
      // Open chrome://inspect/#devices, or Development menu on Safari to debug the WebView.
      // https://github.com/react-native-webview/react-native-webview/blob/master/docs/Debugging.md#debugging-webview-contents
      webviewDebuggingEnabled={__DEV__}
      sharedCookiesEnabled
      originWhitelist={["*"]}
      allowUniversalAccessFromFileURLs
      // startInLoadingState
      allowsBackForwardNavigationGestures
      allowsFullscreenVideo
      injectedJavaScriptBeforeContentLoaded={atStart}
      onNavigationStateChange={onNavigationStateChange}
      onLoadEnd={onLoadEnd}
      onMessage={(e) => {
        const message = e.nativeEvent.data
        const parsed = JSON.parse(message)
        if (parsed.type === "setContentHeight") {
          onContentHeightChange?.({
            nativeEvent: { height: parsed.payload },
          })
          return
        } else if (parsed.type === "previewImage") {
          const { imageUrls, index } = parsed.payload
          runOnUI(() => {
            "worklet"
            // const rect = measureHandle(aviHandle)
            runOnJS(openLightbox)({
              images: (imageUrls as string[]).map((url: string) => ({
                uri: url,
                dimensions: null,
                thumbUri: url,
                thumbDimensions: null,
                thumbRect: null,
                type: "image",
              })),
              index,
            })
          })()
          return
        }
      }}
    />
  )
}

const useWebViewNavigation = ({ webViewRef }: { webViewRef: RefObject<WebView | null> }) => {
  const onNavigationStateChange = useCallback(
    (newNavState: WebViewNavigation) => {
      const { url: urlStr } = newNavState
      const url = URL.canParse(urlStr) ? new URL(urlStr) : null
      if (!url) return
      if (url.protocol === "file:") return
      // if (allowHosts.has(url.host)) return
      webViewRef.current?.stopLoading()
      // const formattedUrl = transformVideoUrl({ url: urlStr })
      if (urlStr) {
        openLink(urlStr)
        return
      }
      openLink(urlStr)
    },
    [webViewRef],
  )

  return { onNavigationStateChange }
}

const styles = {
  // https://github.com/react-native-webview/react-native-webview/issues/318#issuecomment-503979211
  webview: { backgroundColor: "transparent" },
  webviewContainer: { width: "100%", backgroundColor: "transparent" },
} as const
