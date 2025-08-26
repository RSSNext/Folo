import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import type { AIShortcut } from "@follow/shared/settings/interface"

import type { ActionButton } from "~/modules/ai-task/components/ai-item-actions"
import { ItemActions } from "~/modules/ai-task/components/ai-item-actions"

interface ShortcutItemProps {
  shortcut: AIShortcut
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (shortcut: AIShortcut) => void
}

export const ShortcutItem = ({ shortcut, onDelete, onToggle, onEdit }: ShortcutItemProps) => {
  const actions: ActionButton[] = [
    {
      icon: "i-mgc-edit-cute-re",
      onClick: () => onEdit(shortcut),
      title: "Edit shortcut",
    },
    {
      icon: "i-mgc-delete-2-cute-re",
      onClick: () => onDelete(shortcut.id),
      title: "Delete shortcut",
    },
  ]

  return (
    <div className="hover:bg-material-medium border-border group rounded-lg border p-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-text text-sm font-medium">{shortcut.name}</h4>
            {shortcut.hotkey && (
              <KbdCombined kbdProps={{ wrapButton: false }} joint={false}>
                {shortcut.hotkey}
              </KbdCombined>
            )}
          </div>
          <p className="text-text-secondary line-clamp-2 text-xs leading-relaxed">
            {shortcut.prompt}
          </p>
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
