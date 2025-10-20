import { Button } from "@follow/components/ui/button/index.js"
import {
  DEFAULT_SUMMARIZE_TIMELINE_PROMPT,
  DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID,
  defaultAISettings,
} from "@follow/shared/settings/defaults"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"

import { useCreateAIShortcutModal, useEditAIShortcutModal } from "./hooks"
import { ShortcutItem } from "./ShortcutItem"

export const AIShortcutsSection = () => {
  const { t } = useTranslation("ai")
  const { shortcuts } = useAISettingValue()

  useEffect(() => {
    if (!shortcuts.some((shortcut) => shortcut.id === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID)) {
      const defaultSummarizeShortcut = defaultAISettings.shortcuts.find(
        (shortcut) => shortcut.id === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID,
      ) ?? {
        name: "Summarize",
        prompt: DEFAULT_SUMMARIZE_TIMELINE_PROMPT,
        enabled: true,
        displayTargets: ["list"],
        id: DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID,
      }

      setAISetting("shortcuts", [...shortcuts, { ...defaultSummarizeShortcut }])
    }
  }, [shortcuts])

  const handleAddShortcut = useCreateAIShortcutModal()
  const handleEditShortcut = useEditAIShortcutModal()

  const handleDeleteShortcut = (id: string) => {
    setAISetting(
      "shortcuts",
      shortcuts.filter((s) => s.id !== id),
    )
    toast.success(t("shortcuts.deleted"))
  }

  const handleToggleShortcut = (id: string, enabled: boolean) => {
    setAISetting(
      "shortcuts",
      shortcuts.map((s) => (s.id === id ? { ...s, enabled } : s)),
    )
  }

  return (
    <div className="relative space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-secondary text-xs">{t("shortcuts.empty.description")}</p>
        <Button variant="outline" size="sm" onClick={handleAddShortcut}>
          {t("shortcuts.add")}
        </Button>
      </div>
      {shortcuts.length === 0 && (
        <div className="py-8 text-center">
          <div className="bg-fill-secondary mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
            <i className="i-mgc-magic-2-cute-re text-text size-6" />
          </div>
          <h4 className="text-text mb-1 text-sm font-medium">{t("shortcuts.empty.title")}</h4>
        </div>
      )}

      {shortcuts.map((shortcut) => (
        <ShortcutItem
          key={shortcut.id}
          shortcut={shortcut}
          onDelete={handleDeleteShortcut}
          onToggle={handleToggleShortcut}
          onEdit={handleEditShortcut}
        />
      ))}
    </div>
  )
}
