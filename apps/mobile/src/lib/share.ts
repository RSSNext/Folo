import type { ShareContent } from "react-native"

type LinkSharePlatform = "android" | "ios" | "macos" | "native" | "web" | "windows"

interface CreateLinkShareContentOptions {
  platform: LinkSharePlatform
  title?: string
  url: string
  message?: string
}

export const createLinkShareContent = ({
  platform,
  title,
  url,
  message,
}: CreateLinkShareContentOptions): ShareContent => {
  if (platform === "ios") {
    return {
      title,
      url,
    }
  }

  return {
    title,
    message: message || url,
  }
}
