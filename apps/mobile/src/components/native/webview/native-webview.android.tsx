import { useTypeScriptHappyCallback } from "@follow/hooks"
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

import { useLightboxControls } from "../../ui/lightbox/lightboxState"
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
    onSeekAudio?: (e: { time: number }) => void
    url?: string
  }
> = ({ onContentHeightChange, onSeekAudio }) => {
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
      // setSupportMultipleWindows={false}
      onOpenWindow={(e) => {
        const { targetUrl } = e.nativeEvent
        if (targetUrl) {
          openLink(targetUrl)
        }
      }}
      onNavigationStateChange={onNavigationStateChange}
      onLoadEnd={onLoadEnd}
      onMessage={useTypeScriptHappyCallback(
        (e) => {
          const message = e.nativeEvent.data
          const parsed = JSON.parse(message)
          switch (parsed.type) {
            case "setContentHeight": {
              onContentHeightChange?.({
                nativeEvent: { height: parsed.payload },
              })
              return
            }
            case "previewImage": {
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
            case "audio:seekTo": {
              const { time } = parsed.payload
              if (typeof time !== "number") {
                console.warn("Failed to seek audio! Invalid time", time)
                return
              }
              onSeekAudio?.({ time })
              break
            }
            // No default
          }
        },
        [onContentHeightChange, onSeekAudio, openLightbox],
      )}
    />
  )
}

const useWebViewNavigation = ({ webViewRef }: { webViewRef: RefObject<WebView | null> }) => {
  const onNavigationStateChange = useCallback(
    (newNavState: WebViewNavigation) => {
      const { url: urlStr } = newNavState
      let url = null
      try {
        url = new URL(urlStr)
      } catch (error) {
        console.warn("Invalid URL", urlStr, error)
        return
      }
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
