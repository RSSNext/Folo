import { DEV, MICROSOFT_STORE_BUILD, MODE, ModeEnum } from "@follow/shared/constants"

const isStoreDistribution = Boolean(process.mas || MICROSOFT_STORE_BUILD)

export const appUpdaterConfig = {
  // Disable renderer hot update will trigger app update when available
  enableRenderHotUpdate: !DEV && MODE !== ModeEnum.staging,
  enableCoreUpdate: !isStoreDistribution,

  // Disable app update will also disable renderer hot update and core update
  enableAppUpdate: !DEV,
  enableDistributionStoreUpdate: isStoreDistribution,

  app: {
    autoCheckUpdate: !DEV,
    autoDownloadUpdate: !DEV,
    checkUpdateInterval: 15 * 60 * 1000,
  },
}
