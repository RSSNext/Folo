import { DEV } from "@follow/shared/constants"

export const appUpdaterConfig = {
  // Disable renderer hot update will trigger app update when available
  enableRenderHotUpdate: !DEV,
  enableCoreUpdate: !process.mas && !process.windowsStore,
  // Disable app update will also disable renderer hot update and core update
  enableAppUpdate: !DEV,

  app: {
    autoCheckUpdate: true,
    autoDownloadUpdate: true,
    checkUpdateInterval: 15 * 60 * 1000,
  },
}
