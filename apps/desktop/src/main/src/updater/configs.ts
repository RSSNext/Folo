import { DEV } from "@follow/shared/constants"
import path from "path"

export const appUpdaterConfig = {
  // Disable renderer hot update will trigger app update when available
  enableRenderHotUpdate: !DEV,
  enableCoreUpdate: (!process.mas && !process.windowsStore
    // Disable core update if platfrom is windows and application is't executing from default installion path.
    && !(process.platform == "win32" && path.dirname(path.dirname(process.execPath)) != process.env.LOCALAPPDATA)
  ),
  // Disable app update will also disable renderer hot update and core update
  enableAppUpdate: !DEV,

  app: {
    autoCheckUpdate: true,
    autoDownloadUpdate: true,
    checkUpdateInterval: 15 * 60 * 1000,
  },
}
