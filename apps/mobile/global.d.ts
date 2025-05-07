import type { DOMProps } from "expo/dom"
import type { FC } from "react"
import type WebView from "react-native-webview"

declare global {
  export type WebComponent<P = object> = FC<P & { dom?: DOMProps } & React.RefAttributes<WebView>>
}
export {}
