import { Platform } from "react-native"
import DeviceInfo from "react-native-device-info"

import { isIos26 } from "@/src/lib/platform"

/**
 * iPhone on iOS 26+ uses the native tab bar, whose glass player bar floats over pushed screens.
 * iPad, older iOS versions and Android use the JS tab bar, which pushed screens cover.
 */
export const isNativeTabBarEnabled = Platform.OS === "ios" && isIos26 && !DeviceInfo.isTablet()
