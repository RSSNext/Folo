import { DEFAULT_SHORTCUT_TARGETS } from "@follow/shared/settings/interface"
import { nextFrame } from "@follow/utils"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAISettingValue } from "~/atoms/settings/ai"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"
import { AI_SETTING_SECTION_IDS } from "~/modules/settings/tabs/ai"
import { useCreateAIShortcutModal } from "~/modules/settings/tabs/ai/shortcuts/hooks"

import type { ShortcutData } from "../../editor/plugins/shortcut/types"
import { useMainEntryId } from "../../hooks/useMainEntryId"
import { AIShortcutButton } from "../ui/AIShortcutButton"

interface ChatShortcutsRowProps {
  onSelect: (shortcutData: ShortcutData) => void
}

export const ChatShortcutsRow: React.FC<ChatShortcutsRowProps> = ({ onSelect }) => {
  const { t } = useTranslation("ai")
  const aiSettings = useAISettingValue()
  const mainEntryId = useMainEntryId()
  const showSettings = useSettingModal()

  const shortcutsToDisplay = useMemo(() => {
    const shortcuts = aiSettings.shortcuts ?? []
    const list: typeof shortcuts = []
    const entry: typeof shortcuts = []

    for (const shortcut of shortcuts) {
      if (!shortcut.enabled) continue
      const targets =
        shortcut.displayTargets && shortcut.displayTargets.length > 0
          ? shortcut.displayTargets
          : DEFAULT_SHORTCUT_TARGETS
      if (targets.includes("list")) {
        list.push(shortcut)
      }
      if (targets.includes("entry")) {
        entry.push(shortcut)
      }
    }

    return (mainEntryId ? entry : list) ?? []
  }, [aiSettings.shortcuts, mainEntryId])

  const handleAddShortcut = useCreateAIShortcutModal()
  const handleCustomize = useCallback(() => {
    showSettings({ tab: "ai", section: AI_SETTING_SECTION_IDS.shortcuts })
    nextFrame(() => {
      handleAddShortcut()
    })
  }, [handleAddShortcut, showSettings])

  return (
    <div className="mb-3 px-1">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto py-1">
        <AIShortcutButton
          onClick={handleCustomize}
          animationDelay={0}
          size="sm"
          title={t("customize_shortcuts_title")}
        >
          <i className="i-mgc-add-cute-re" />
        </AIShortcutButton>
        {shortcutsToDisplay.map((shortcut) => (
          <AIShortcutButton
            key={shortcut.id}
            onClick={() => onSelect(shortcut)}
            animationDelay={0}
            size="sm"
            title={shortcut.hotkey ? `${shortcut.name} (${shortcut.hotkey})` : shortcut.name}
          >
            {shortcut.name}
          </AIShortcutButton>
        ))}
      </div>
    </div>
  )
}
