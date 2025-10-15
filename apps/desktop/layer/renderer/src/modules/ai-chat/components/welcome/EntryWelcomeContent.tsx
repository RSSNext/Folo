import type { AIShortcut } from "@follow/shared/settings/interface"
import type { EditorState } from "lexical"
import { m } from "motion/react"
import { useTranslation } from "react-i18next"

import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

import { EntrySummaryCard } from "./EntrySummaryCard"
import { ShortcutButtonGrid } from "./ShortcutButtonGrid"

interface EntryWelcomeContentProps {
  entryId: string
  onSend: (message: EditorState | string) => void
  shortcuts: AIShortcut[]
}

export const EntryWelcomeContent: React.FC<EntryWelcomeContentProps> = ({
  entryId,
  onSend,
  shortcuts,
}) => {
  const { t } = useTranslation("ai")
  const showSettings = useSettingModal()

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <EntrySummaryCard entryId={entryId} />
      <m.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.98 }}
        className="w-full max-w-2xl space-y-3"
      >
        <ShortcutButtonGrid
          shortcuts={shortcuts}
          onSend={onSend}
          onCustomize={() => showSettings("ai")}
          customizeLabel={t("customize_shortcuts")}
          customizeTitle={t("customize_shortcuts_title")}
        />
      </m.div>
    </div>
  )
}
