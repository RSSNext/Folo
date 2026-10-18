import { requireNativeModule } from "expo"
import { openURL } from "expo-linking"

import { getGeneralSettings } from "@/src/atoms/settings/general"

import { isWebUrl } from "../web-url"

interface NativeModule {
  openLink: (url: string) => Promise<{
    type: "dismiss"
  }>
  previewImage: (images: string[]) => void
  scrollToTop: (reactTag: number) => void
  isScrollToEnd: (reactTag: number) => Promise<boolean>
}
const nativeModule = requireNativeModule("Helper") as NativeModule

const openWithSystem = (url: string) => {
  openURL(url).catch((error: unknown) => {
    console.warn("[link] no app opens the link", url, error)
  })
}

export const openLink = (url: string, onDismiss?: () => void) => {
  const { openLinksInExternalApp } = getGeneralSettings()
  // The in-app browser ends the app on any other link than http(s)
  if (openLinksInExternalApp || !isWebUrl(url)) {
    openWithSystem(url)
    return
  }
  nativeModule.openLink(url).then((res) => {
    if (res.type === "dismiss") {
      onDismiss?.()
    }
  })
}

export const performNativeScrollToTop = (reactTag: number) => {
  nativeModule.scrollToTop(reactTag)
}

export const showIntelligenceGlowEffect = () => {
  requireNativeModule("AppleIntelligenceGlowEffect").show()

  return hideIntelligenceGlowEffect
}

export const hideIntelligenceGlowEffect = () => {
  requireNativeModule("AppleIntelligenceGlowEffect").hide()
}

export const isScrollToEnd = async (tag: number) => {
  return nativeModule.isScrollToEnd(tag)
}
