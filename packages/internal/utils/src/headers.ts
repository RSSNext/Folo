import { DEV, MICROSOFT_STORE_BUILD, WEB_BUILD } from "@follow/shared/constants"

import { imageRefererMatches } from "./img-proxy"

export const createBuildSafeHeaders =
  (webUrl: string, selfRefererMatches: string[]) =>
  ({ url, headers = {} }: { url: string; headers?: Record<string, string> }) => {
    // user agent
    if (headers["User-Agent"]) {
      headers["User-Agent"] = headers["User-Agent"]
        .replace(/\s?Electron\/[\d.]+/, "")
        .replace(/\s?Folo\/[\d.a-zA-Z-]+/, "")
    } else {
      headers["User-Agent"] =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"
    }

    // referer and origin
    if (selfRefererMatches.filter((i) => !!i).some((item) => url.startsWith(item))) {
      headers.Referer = webUrl
      return headers
    }

    const refererMatch = imageRefererMatches.find((item) => item.url.test(url))
    const referer = refererMatch?.referer
    if (referer) {
      headers.Referer = referer
      headers.Origin = referer
      return headers
    }

    if (
      (headers.Referer && headers.Referer !== "app://folo.is") ||
      (headers.Origin && headers.Origin !== "app://folo.is")
    ) {
      return headers
    }

    try {
      if (url) {
        const urlObj = new URL(url)

        headers.Referer = urlObj.origin
        headers.Origin = urlObj.origin
      }
    } catch (error) {
      console.warn(`Url parsing error: ${error}, url: ${url}.`)
    }

    return headers
  }

const commonHeaders = {
  "Cache-Control": "no-store",
}

enum DesktopPlatform {
  Desktop = "desktop",
  DesktopWeb = "desktop/web",
  DesktopMacOS = "desktop/macos",
  DesktopMacOSDMG = "desktop/macos/dmg",
  DesktopMacOSMAS = "desktop/macos/mas",
  DesktopWindowsEXE = "desktop/windows/exe",
  DesktopWindowsMS = "desktop/windows/ms",
  DesktopLinux = "desktop/linux",
}

export const createDesktopAPIHeaders = ({ version }: { version: string }) => {
  let platform: DesktopPlatform | null = null

  if (WEB_BUILD) {
    platform = DesktopPlatform.DesktopWeb
  } else if (typeof process !== "undefined") {
    switch (process.platform) {
      case "darwin": {
        if (process.mas) {
          platform = DesktopPlatform.DesktopMacOSMAS
        } else {
          platform = DesktopPlatform.DesktopMacOSDMG
        }
        break
      }
      case "win32": {
        if (MICROSOFT_STORE_BUILD) {
          platform = DesktopPlatform.DesktopWindowsMS
        } else {
          platform = DesktopPlatform.DesktopWindowsEXE
        }
        break
      }
      case "linux": {
        platform = DesktopPlatform.DesktopLinux
        break
      }
    }
  }

  return {
    ...commonHeaders,
    ...(platform ? { "X-App-Platform": platform } : {}),
    "X-App-Name": "Folo Web",
    "X-App-Version": version,
    ...(DEV ? { "X-App-Dev": "1" } : {}),
  }
}

enum SSRPlatform {
  SSR = "ssr",
}

export const createSSRAPIHeaders = ({ version }: { version: string }) => {
  return {
    ...commonHeaders,
    "X-App-Platform": SSRPlatform.SSR,
    "X-App-Name": "Folo SSR",
    "X-App-Version": version,
    ...(DEV ? { "X-App-Dev": "1" } : {}),
  }
}

enum MobilePlatform {
  MobileIOSiPhone = "mobile/ios/iphone",
  MobileIOSiPad = "mobile/ios/ipad",
  MobileAndroidAPK = "mobile/android/apk",
  MobileAndroidGooglePlay = "mobile/android/googleplay",
}

export const createMobileAPIHeaders = ({
  version,
  rnPlatform,
  installerPackageName,
}: {
  version: string
  rnPlatform: {
    OS: "ios" | "android" | "windows" | "macos" | "web"
    isPad: boolean
  }
  installerPackageName?: string
}) => {
  let platform: MobilePlatform | null = null

  if (rnPlatform.OS === "ios") {
    if (rnPlatform.isPad) {
      platform = MobilePlatform.MobileIOSiPad
    } else {
      platform = MobilePlatform.MobileIOSiPhone
    }
  } else if (rnPlatform.OS === "android") {
    if (installerPackageName === "com.android.vending") {
      platform = MobilePlatform.MobileAndroidGooglePlay
    } else {
      platform = MobilePlatform.MobileAndroidAPK
    }
  }

  return {
    ...commonHeaders,
    ...(platform ? { "X-App-Platform": platform } : {}),
    "X-App-Name": "Folo Mobile",
    "X-App-Version": version,
  }
}
