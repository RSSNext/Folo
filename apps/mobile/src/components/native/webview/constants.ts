import { Image, Platform } from "react-native"

// HTML renderer asset configuration
const HTML_RENDERER_ASSET = "rn-web/html-renderer"
const ANDROID_ASSET_BASE = "file:///android_asset/html-renderer/index.html"

const getAssetPath = () => {
  try {
    return Image.resolveAssetSource({
      uri: HTML_RENDERER_ASSET,
    }).uri
  } catch (error) {
    console.warn("Failed to resolve HTML renderer asset path:", error)
    return ""
  }
}

export const htmlUrl =
  Platform.select({
    ios: `file://${getAssetPath()}/index.html`,
    android: ANDROID_ASSET_BASE,
    default: "",
  }) || ""
