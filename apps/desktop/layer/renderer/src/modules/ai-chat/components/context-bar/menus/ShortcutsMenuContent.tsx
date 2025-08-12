import type { FC } from "react"

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

interface ShortcutsMenuContentProps {
  shortcuts: Array<{
    id: string
    name: string
    prompt: string
    enabled: boolean
  }>
  onSendShortcut?: (prompt: string) => void
}

export const ShortcutsMenuContent: FC<ShortcutsMenuContentProps> = ({
  shortcuts,
  onSendShortcut,
}) => {
  const showSettingModal = useSettingModal()
  const enabledShortcuts = shortcuts.filter((shortcut) => shortcut.enabled)

  return (
    <DropdownMenuContent align="start">
      {enabledShortcuts.length === 0 ? (
        <div className="text-text-tertiary p-3 text-center text-xs">No shortcuts configured</div>
      ) : (
        enabledShortcuts.map((shortcut) => (
          <DropdownMenuItem key={shortcut.id} onClick={() => onSendShortcut?.(shortcut.prompt)}>
            <i className="i-mgc-magic-2-cute-re mr-1.5 size-3.5" />
            <span className="truncate">{shortcut.name}</span>
          </DropdownMenuItem>
        ))
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          showSettingModal("ai")
        }}
      >
        <i className="i-mgc-settings-7-cute-re mr-1.5 size-3.5" />
        <span>Manage Shortcut</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
