import { jotaiStore } from "@follow/utils"
import { atom } from "jotai"
import type * as React from "react"
import type { ViewProps } from "react-native"
import WebView from "react-native-webview"

import { htmlUrl } from "./constants"

const webviewAtom = atom<WebView | null>(null)

const setWebview = (webview: WebView | null) => {
  jotaiStore.set(webviewAtom, webview)
}

export const injectJavaScript = (js: string) => {
  const webview = jotaiStore.get(webviewAtom)
  if (webview) {
    return webview.injectJavaScript(js)
  }
}

const injectedJavaScript = `
const rootElement = document.querySelector("#root");

// Initial height reporting
window.ReactNativeWebView.postMessage(
  JSON.stringify({
    type: "content-height-changed",
    height: rootElement.scrollHeight,
  }),
)

// Set up mutation observer to detect DOM changes
if (rootElement) {
  const observer = new MutationObserver(function(mutations) {
    // Post message when mutations are detected
    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: "content-height-changed",
        height: document.querySelector("#root").scrollHeight,
      }),
    )
  });

  // Configure and start the observer
  observer.observe(rootElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
  });
}
`

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
      injectedJavaScriptBeforeContentLoaded={injectedJavaScript}
      onMessage={(e) => {
        const message = e.nativeEvent.data
        const parsed = JSON.parse(message)
        if (parsed.type === "content-height-changed") {
          onContentHeightChange?.({
            nativeEvent: { height: parsed.height + 16 },
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
