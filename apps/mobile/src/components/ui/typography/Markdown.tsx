import type { FC } from "react"
import { useRef } from "react"
import { Linking } from "react-native"
import type { WebView } from "react-native-webview"

import MarkdownWeb from "./MarkdownWeb"

export const Markdown: FC<{
  value: string
  style?: React.CSSProperties
  className?: string

  webViewProps?: import("expo/dom").DOMProps
}> = ({ value, style, className, webViewProps }) => {
  const ref = useRef<WebView>(null)

  return (
    <MarkdownWeb
      value={value}
      ref={ref}
      style={style}
      className={className}
      dom={{
        ...webViewProps,

        onMessage: (event) => {
          const { type, url } = JSON.parse(event.nativeEvent.data)
          if (type === "openLinkInModal") {
            Linking.openURL(url)
          }
        },
        injectedJavaScriptBeforeContentLoaded: `window.openLinkInModal = (url) => {
           window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "openLinkInModal",
            url,
           }))
        }`,
      }}
    />
  )
}
