import { Platform } from "react-native"

export const isIOS = Platform.OS === "ios"
export const isAndroid = Platform.OS === "android"
export const isNative = isIOS || isAndroid
export const devicePlatform = isIOS ? "ios" : isAndroid ? "android" : "web"
export const isWeb = !isNative

// Platform.Version is the API level on Android (34 and up), not an iOS version
export const isIos26 = isIOS && Number.parseFloat(String(Platform.Version)) >= 26
