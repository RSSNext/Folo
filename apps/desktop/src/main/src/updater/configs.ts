import path from "node:path"

import { DEV } from "@follow/shared/constants"

import { isWindows } from "../env"

export const appUpdaterConfig = {
  // Disable renderer hot update will trigger app update when available
  enableRenderHotUpdate: !DEV,
  enableCoreUpdate:
    !process.mas &&
    !process.windowsStore &&
    // Disable core update if platfrom is windows and application is't executing from default installion path.
    // If the process is not executed from the default installation path,
    // it is usually managed through a package manager like Scoop.
    // In this case, updates need to be disabled.
    !(isWindows && path.resolve(process.execPath, "../../") !== process.env.LOCALAPPDATA),
  // Disable app update will also disable renderer hot update and core update
  enableAppUpdate: !DEV,

  app: {
    autoCheckUpdate: true,
    autoDownloadUpdate: true,
    checkUpdateInterval: 15 * 60 * 1000,
  },
}
