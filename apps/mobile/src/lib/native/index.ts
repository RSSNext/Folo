import { openURL } from "expo-linking"
import * as WebBrowser from "expo-web-browser"

import { getGeneralSettings } from "@/src/atoms/settings/general"

export const openLink = (url: string, onDismiss?: () => void) => {
  const { openLinksInExternalApp } = getGeneralSettings()
  if (openLinksInExternalApp) {
    openURL(url)
    return
  }
  WebBrowser.openBrowserAsync(url).then((res) => {
    if (res.type === "dismiss") {
      onDismiss?.()
    }
  })
}

export const performNativeScrollToTop = (_reactTag: number) => {
  throw new Error("performNativeScrollToTop is not supported on this platform")
}

export const showIntelligenceGlowEffect = () => {
  return hideIntelligenceGlowEffect
}

export const hideIntelligenceGlowEffect = () => {}

export const isScrollToEnd = async (_reactTag: number) => {
  return false
}
