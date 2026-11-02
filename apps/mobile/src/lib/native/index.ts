import { openURL } from "expo-linking"
import * as WebBrowser from "expo-web-browser"

import { getGeneralSettings } from "@/src/atoms/settings/general"

import { isWebUrl } from "../web-url"

const openWithSystem = (url: string) => {
  openURL(url).catch((error: unknown) => {
    console.warn("[link] no app opens the link", url, error)
  })
}

export const openLink = (
  url: string,
  /**
   * @ios Only available on iOS
   */
  _onDismiss?: () => void,
) => {
  const { openLinksInExternalApp } = getGeneralSettings()
  // A custom tab shows http(s) pages only; mailto: and other links go to their apps
  if (openLinksInExternalApp || !isWebUrl(url)) {
    openWithSystem(url)
    return
  }
  WebBrowser.openBrowserAsync(url).catch((error: unknown) => {
    console.warn("[link] the browser did not open the link", url, error)
  })
}

/** Custom tabs close by themselves when a link brings the app to the front */
export const dismissInAppBrowser = async () => {}

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
