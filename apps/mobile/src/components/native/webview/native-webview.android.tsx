import { jotaiStore } from "@follow/utils"
import { atom } from "jotai"
import type * as React from "react"
import { useCallback } from "react"
import type { ViewProps } from "react-native"
import WebView from "react-native-webview"

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

export const NativeWebView: React.ComponentType<
  ViewProps & {
    onContentHeightChange?: (e: { nativeEvent: { height: number } }) => void
    url?: string
  }
> = ({ onContentHeightChange }) => {
  return (
    <WebView
      ref={(webview) => {
        setWebview(webview)
      }}
      style={styles.webview}
      containerStyle={styles.webviewContainer}
      source={{ uri: htmlUrl }}
      webviewDebuggingEnabled={__DEV__}
      sharedCookiesEnabled
      originWhitelist={["*"]}
      allowUniversalAccessFromFileURLs
      startInLoadingState
      allowsBackForwardNavigationGestures
      injectedJavaScriptBeforeContentLoaded={atStart}
      onLoadEnd={useCallback(() => {
        injectJavaScript(atEnd)
      }, [])}
      onMessage={(e) => {
        const message = e.nativeEvent.data
        const parsed = JSON.parse(message)
        if (parsed.type === "setContentHeight") {
          onContentHeightChange?.({
            nativeEvent: { height: parsed.payload },
          })
          return
        }
      }}
    />
  )
}

const styles = {
  // https://github.com/react-native-webview/react-native-webview/issues/318#issuecomment-503979211
  webview: { backgroundColor: "transparent" },
  webviewContainer: { width: "100%", backgroundColor: "transparent" },
} as const
