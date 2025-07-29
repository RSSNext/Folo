import { RootPortal } from "@follow/components/ui/portal/index.js"
import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { useTranslation } from "react-i18next"

import { useGeneralSettingKey } from "~/atoms/settings/general"
import { IconTransition } from "~/components/ux/transition/icon"

export const EnhancedSettingsIndicator = () => {
  const enhancedSettings = useGeneralSettingKey("enhancedSettings")
  const { t } = useTranslation("settings")

  if (!enhancedSettings) return null
  return (
    <Tooltip>
      <TooltipTrigger>
        <IconTransition animatedKey={enhancedSettings ? "done" : "init"} preset="fade">
          {enhancedSettings ? (
            <i className="i-mgc-rocket-cute-fi text-accent size-4" />
          ) : (
            <i className="i-mgc-rocket-cute-re size-4 opacity-50" />
          )}
        </IconTransition>
      </TooltipTrigger>
      <RootPortal>
        <TooltipContent className="max-w-[40ch]">
          {enhancedSettings ? (
            <p>{t("general.enhanced.enabled.tip")}</p>
          ) : (
            <p>{t("general.enhanced.disabled.tip")}</p>
          )}
        </TooltipContent>
      </RootPortal>
    </Tooltip>
  )
}
