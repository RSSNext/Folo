import { MdiMeditation } from "@follow/components/icons/Meditation.js"
import { ActionButton } from "@follow/components/ui/button/index.js"
import { tracker } from "@follow/tracker"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import { setUISetting, useIsZenMode, useRealInWideMode, useSetZenMode } from "~/atoms/settings/ui"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandShortcuts } from "~/modules/command/hooks/use-command-binding"

export const WideModeButton = () => {
  const isWideMode = useRealInWideMode()
  const isZenMode = useIsZenMode()
  const { t } = useTranslation()

  const setIsZenMode = useSetZenMode()
  const shortcuts = useCommandShortcuts()
  return (
    <ActionButton
      shortcut={shortcuts[COMMAND_ID.layout.toggleWideMode]}
      onClick={() => {
        if (isZenMode) {
          setIsZenMode(false)
        } else {
          setUISetting("wideMode", !isWideMode)
          // TODO: Remove this after useMeasure can get bounds in time
          window.dispatchEvent(new Event("resize"))
        }
        tracker.wideMode({ mode: isWideMode ? "wide" : "normal" })
      }}
      tooltip={
        isZenMode
          ? t("zen.exit")
          : !isWideMode
            ? t("entry_list_header.switch_to_widemode")
            : t("entry_list_header.switch_to_normalmode")
      }
    >
      {isZenMode ? (
        <MdiMeditation />
      ) : (
        <i
          className={cn(isWideMode ? "i-mgc-align-justify-cute-re" : "i-mgc-align-left-cute-re")}
        />
      )}
    </ActionButton>
  )
}
