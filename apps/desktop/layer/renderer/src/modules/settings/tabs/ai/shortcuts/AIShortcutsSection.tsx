import type { AIShortcut } from "@follow/shared/settings/interface"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { setAISetting, useAISettingValue } from "~/atoms/settings/ai"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { SettingActionItem } from "../../../control"
import { ShortcutItem } from "./ShortcutItem"
import { ShortcutModalContent } from "./ShortcutModalContent"

export const AIShortcutsSection = () => {
  const { t } = useTranslation("ai")
  const { shortcuts } = useAISettingValue()
  const { present } = useModalStack()

  const handleAddShortcut = () => {
    present({
      title: "Add AI Shortcut",
      content: ({ dismiss }: { dismiss: () => void }) => (
        <ShortcutModalContent
          shortcut={null}
          onSave={(shortcut) => {
            const newShortcut: AIShortcut = {
              ...shortcut,
              id: Date.now().toString(),
            }
            setAISetting("shortcuts", [...shortcuts, newShortcut])
            toast.success(t("shortcuts.added"))
            dismiss()
          }}
          onCancel={dismiss}
        />
      ),
    })
  }

  const handleEditShortcut = (shortcut: AIShortcut) => {
    present({
      title: "Edit AI Shortcut",
      content: ({ dismiss }: { dismiss: () => void }) => (
        <ShortcutModalContent
          shortcut={shortcut}
          onSave={(updatedShortcut) => {
            setAISetting(
              "shortcuts",
              shortcuts.map((s) =>
                s.id === shortcut.id ? { ...updatedShortcut, id: shortcut.id } : s,
              ),
            )
            toast.success(t("shortcuts.updated"))
            dismiss()
          }}
          onCancel={dismiss}
        />
      ),
    })
  }

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
    <div className="space-y-4">
      <SettingActionItem
        label={t("shortcuts.add")}
        action={handleAddShortcut}
        buttonText={t("shortcuts.add")}
      />

      {shortcuts.length === 0 && (
        <div className="py-8 text-center">
          <div className="bg-fill-secondary mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
            <i className="i-mgc-magic-2-cute-re text-text size-6" />
          </div>
          <h4 className="text-text mb-1 text-sm font-medium">{t("shortcuts.empty.title")}</h4>
          <p className="text-text-secondary text-xs">{t("shortcuts.empty.description")}</p>
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
