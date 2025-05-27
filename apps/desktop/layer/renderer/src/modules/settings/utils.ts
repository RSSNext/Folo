import type { UserRole } from "@follow/constants"
import type { ServerConfigs } from "@follow/models"

export interface SettingPageContext {
  role: Nullable<UserRole>
  isInMASReview: boolean
}

export enum DisableWhy {
  Noop = "noop",
  NotActivation = "not_activation",
}

export interface SettingPageConfig {
  icon: string | React.ReactNode
  name: I18nKeysForSettings
  title?: I18nKeysForSettings
  priority: number
  headerIcon?: string | React.ReactNode
  hideIf?: (ctx: SettingPageContext, serverConfigs?: ServerConfigs | null) => boolean
  disableIf?: (
    ctx: SettingPageContext,
    serverConfigs?: ServerConfigs | null,
  ) => [boolean, DisableWhy]
  viewportClassName?: string
}
export const defineSettingPageData = (config: SettingPageConfig) => ({
  ...config,
})
