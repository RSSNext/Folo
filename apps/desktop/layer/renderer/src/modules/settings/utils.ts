import type { UserRole } from "@follow/constants"

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
  priority: number
  headerIcon?: string | React.ReactNode
  hideIf?: (ctx: SettingPageContext) => boolean
  disableIf?: (ctx: SettingPageContext) => [boolean, DisableWhy]
}
export const defineSettingPageData = (config: SettingPageConfig) => ({
  ...config,
})
