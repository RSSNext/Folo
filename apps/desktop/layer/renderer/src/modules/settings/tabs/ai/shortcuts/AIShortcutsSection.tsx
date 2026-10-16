import { Button } from "@follow/components/ui/button/index.js"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getAISettings, setAISetting, useAISettingValue } from "~/atoms/settings/ai"
import { useDialog } from "~/components/ui/modal/stacked/hooks"

import { useCreateAIShortcutModal, useEditAIShortcutModal } from "./hooks"
import { ShortcutItem } from "./ShortcutItem"

export const AIShortcutsSection = () => {
  const { t } = useTranslation("ai")
  const { shortcuts } = useAISettingValue()

  const handleAddShortcut = useCreateAIShortcutModal()
  const handleEditShortcut = useEditAIShortcutModal()
  const { ask } = useDialog()

  const handleDeleteShortcut = async (id: string) => {
    const shortcut = shortcuts.find((s) => s.id === id)
    if (!shortcut) return
    // The name, prompt and hotkey the user wrote cannot be brought back
    const confirmed = await ask({
      title: t("shortcuts.delete_title"),
      message: t("shortcuts.delete_confirm", { name: shortcut.name }),
      confirmText: t("words.delete", { ns: "common" }),
      cancelText: t("words.cancel", { ns: "common" }),
      variant: "danger",
    })
    if (!confirmed) return

    setAISetting(
      "shortcuts",
      getAISettings().shortcuts.filter((s) => s.id !== id),
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
    <div className="relative -mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-secondary">{t("shortcuts.empty.description")}</p>
        <Button variant="outline" size="sm" onClick={handleAddShortcut}>
          {t("shortcuts.add")}
        </Button>
      </div>
      {shortcuts.length === 0 && (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-fill-secondary">
            <i className="i-mgc-magic-2-cute-re size-6 text-text" />
          </div>
          <h4 className="mb-1 text-sm font-medium text-text">{t("shortcuts.empty.title")}</h4>
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
