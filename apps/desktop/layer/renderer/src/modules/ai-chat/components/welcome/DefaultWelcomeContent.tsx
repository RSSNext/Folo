import type { AIShortcut } from "@follow/shared/settings/interface"
import type { EditorState } from "lexical"
import { m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { ShortcutButtonGrid } from "./ShortcutButtonGrid"

interface DefaultWelcomeContentProps {
  onSend: (message: EditorState | string) => void
  shortcuts: AIShortcut[]
}

export const DefaultWelcomeContent: React.FC<DefaultWelcomeContentProps> = ({
  onSend,
  shortcuts,
}) => {
  const { t } = useTranslation("ai")
  const showSettings = useSettingModal()

  return (
    <m.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      className="w-full space-y-8"
    >
      <ShortcutButtonGrid
        shortcuts={shortcuts}
        onSend={onSend}
        onCustomize={() => showSettings("ai")}
        customizeLabel={t("customize_shortcuts")}
        customizeTitle={t("customize_shortcuts_title")}
      />
    </m.div>
  )
}
