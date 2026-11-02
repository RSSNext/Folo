import os from "node:os"

import { DEV } from "@follow/shared/constants"

export const channel: "development" | "beta" | "alpha" | "stable" = DEV ? "development" : "stable"

const { platform } = process
export const isMacOS = platform === "darwin"
export const isMAS = process.mas

export const isWindows = platform === "win32"

export const isLinux = platform === "linux"

/** The temporary profile the end-to-end tests run the app on */
export const e2eUserDataDir = process.env.FOLO_E2E_USER_DATA_DIR

/**
 * A test run of the unpackaged app. It uses the release URL schemes, see `DEV`, and must leave
 * the installed app's registration and log alone.
 */
export const isTestRun = process.env.NODE_ENV === "test" || !!e2eUserDataDir

/**
 * @see https://learn.microsoft.com/en-us/windows/release-health/windows11-release-information
 * Windows 11 buildNumber starts from 22000.
 */
const detectingWindows11 = () => {
  if (!isWindows) return false

  const release = os.release()
  const majorVersion = Number.parseInt(release.split(".")[0]!)
  const buildNumber = Number.parseInt(release.split(".")[2]!)

  return majorVersion === 10 && buildNumber >= 22000
}

export const isWindows11 = detectingWindows11()
