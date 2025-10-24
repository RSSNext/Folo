import type { AIShortcut } from "@follow/shared/settings/interface"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getAISettings, setAISetting } from "~/atoms/settings/ai"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { ShortcutModalContent } from "./ShortcutModalContent"

export const useCreateAIShortcutModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation("ai")
  return useCallback(() => {
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
            const { shortcuts } = getAISettings()
            setAISetting("shortcuts", [...shortcuts, newShortcut])
            toast.success(t("shortcuts.added"))
            dismiss()
          }}
          onCancel={dismiss}
        />
      ),
    })
  }, [present, t])
}

export const useEditAIShortcutModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation("ai")
  return useCallback(
    (shortcut: AIShortcut) => {
      present({
        title: "Edit AI Shortcut",
        content: ({ dismiss }: { dismiss: () => void }) => (
          <ShortcutModalContent
            shortcut={shortcut}
            onSave={(updatedShortcut) => {
              const { shortcuts } = getAISettings()
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
    },
    [present, t],
  )
}
