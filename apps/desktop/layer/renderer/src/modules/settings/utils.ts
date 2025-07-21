import type { UserRole } from "@follow/constants"
import type { ExtractResponseData, GetStatusConfigsResponse } from "@follow-app/client-sdk"

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
  hideIf?: (
    ctx: SettingPageContext,
    serverConfigs?: ExtractResponseData<GetStatusConfigsResponse> | null,
  ) => boolean
  disableIf?: (
    ctx: SettingPageContext,
    serverConfigs?: ExtractResponseData<GetStatusConfigsResponse> | null,
  ) => [boolean, DisableWhy]
  viewportClassName?: string
}
export const defineSettingPageData = (config: SettingPageConfig) => ({
  ...config,
})
