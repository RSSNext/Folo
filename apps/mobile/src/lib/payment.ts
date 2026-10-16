import DeviceInfo from "react-native-device-info"

import { isAndroid } from "./platform"

const GOOGLE_PLAY_INSTALLER_PACKAGE_NAME = "com.android.vending"
// react-native-device-info reports this when Android has no installer on record, e.g. adb installs
const UNKNOWN_INSTALLER_PACKAGE_NAME = "unknown"

type AndroidInstallSource = "google-play" | "other" | "unknown"

let androidInstallSourceCache: AndroidInstallSource | undefined

export const getAndroidInstallSource = (
  installerPackageName?: string | null,
): AndroidInstallSource => {
  if (!installerPackageName || installerPackageName === UNKNOWN_INSTALLER_PACKAGE_NAME) {
    return "unknown"
  }

  return installerPackageName === GOOGLE_PLAY_INSTALLER_PACKAGE_NAME ? "google-play" : "other"
}

const getCurrentAndroidInstallSource = () => {
  if (androidInstallSourceCache === undefined) {
    try {
      androidInstallSourceCache = getAndroidInstallSource(DeviceInfo.getInstallerPackageNameSync())
    } catch {
      androidInstallSourceCache = "unknown"
    }
  }

  return androidInstallSourceCache
}

export const isAndroidApkInstall = () =>
  isAndroid && getCurrentAndroidInstallSource() !== "google-play"

export type MobileBillingProvider = "app-store" | "google-play" | "stripe"

/**
 * Google Play only allows its own billing in apps it distributes, so Stripe is limited to Android
 * builds installed from somewhere else, such as the GitHub APK. When the installer cannot be told,
 * the app assumes Google Play and never offers Stripe.
 */
export const resolveMobileBillingProvider = ({
  installSource,
  isAndroid,
}: {
  installSource: AndroidInstallSource
  isAndroid: boolean
}): MobileBillingProvider => {
  if (!isAndroid) {
    return "app-store"
  }

  return installSource === "other" ? "stripe" : "google-play"
}

export const getMobileBillingProvider = () =>
  resolveMobileBillingProvider({
    installSource: isAndroid ? getCurrentAndroidInstallSource() : "unknown",
    isAndroid,
  })

export const isPaymentFeatureEnabled: (paymentEnabled?: boolean | null) => boolean = Boolean
