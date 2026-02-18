import DeviceInfo from "react-native-device-info"

import { isAndroid } from "./platform"

const GOOGLE_PLAY_INSTALLER_PACKAGE_NAME = "com.android.vending"
let isAndroidApkInstallCache: boolean | undefined

const isGooglePlayInstall = (installerPackageName?: string | null) =>
  installerPackageName === GOOGLE_PLAY_INSTALLER_PACKAGE_NAME

export const isAndroidApkInstall = () => {
  if (isAndroidApkInstallCache !== undefined) {
    return isAndroidApkInstallCache
  }

  if (!isAndroid) {
    isAndroidApkInstallCache = false
    return isAndroidApkInstallCache
  }

  try {
    isAndroidApkInstallCache = !isGooglePlayInstall(DeviceInfo.getInstallerPackageNameSync())
    return isAndroidApkInstallCache
  } catch {
    // Treat unknown installer as APK-style install and keep behavior permissive.
    isAndroidApkInstallCache = true
    return isAndroidApkInstallCache
  }
}

export const isPaymentFeatureEnabled = (paymentEnabled?: boolean | null) =>
  Boolean(paymentEnabled) && isAndroidApkInstall()
