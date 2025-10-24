import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID } from "@follow/shared/settings/defaults"
import type { AIShortcut } from "@follow/shared/settings/interface"
import { useTranslation } from "react-i18next"

import type { ActionButton } from "~/modules/ai-task/components/ai-item-actions"
import { ItemActions } from "~/modules/ai-task/components/ai-item-actions"

interface ShortcutItemProps {
  shortcut: AIShortcut
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (shortcut: AIShortcut) => void
}

export const ShortcutItem = ({ shortcut, onDelete, onToggle, onEdit }: ShortcutItemProps) => {
  const { t } = useTranslation("ai")
  const isProtected =
    shortcut.defaultPrompt || shortcut.id === DEFAULT_SUMMARIZE_TIMELINE_SHORTCUT_ID
  const actions: ActionButton[] = [
    {
      icon: "i-mgc-edit-cute-re",
      onClick: () => onEdit(shortcut),
      title: "Edit shortcut",
    },
  ]

  if (!isProtected) {
    actions.push({
      icon: "i-mgc-delete-2-cute-re",
      onClick: () => onDelete(shortcut.id),
      title: "Delete shortcut",
    })
  }

  return (
    <div className="group -ml-3 rounded-lg border border-border p-3 transition-colors hover:bg-material-medium">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <i className={shortcut.icon || "i-mgc-hotkey-cute-re"} />
            <h4 className="text-sm font-medium text-text">{shortcut.name}</h4>
            {shortcut.hotkey && (
              <KbdCombined kbdProps={{ wrapButton: false }} joint={false}>
                {shortcut.hotkey}
              </KbdCombined>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {shortcut.displayTargets?.map((target) => (
              <span
                key={target}
                className="inline-flex items-center rounded-full bg-material-thin px-2 py-0.5 text-[11px] font-medium tracking-wide text-text-tertiary"
              >
                {t(`shortcuts.targets.${target}`)}
              </span>
            ))}
          </div>
        </div>

        <ItemActions
          actions={actions}
          enabled={shortcut.enabled}
          onToggle={(enabled) => onToggle(shortcut.id, enabled)}
        />
      </div>
    </div>
  )
}
