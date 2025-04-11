import { openURL } from "expo-linking"

// eslint-disable-next-line unused-imports/no-unused-vars
export const openLink = (url: string, onDismiss?: () => void) => {
  openURL(url)
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
