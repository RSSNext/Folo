import type { AIShortcut } from "@follow/shared/settings/interface"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

import { getShortcutEffectivePrompt } from "~/atoms/settings/ai"
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu/dropdown-menu"
import { useSettingModal } from "~/modules/settings/modal/use-setting-modal-hack"

interface ShortcutsMenuContentProps {
  shortcuts: AIShortcut[]
  context: "list" | "entry"
  onSendShortcut?: (prompt: string) => void
}

export const ShortcutsMenuContent: FC<ShortcutsMenuContentProps> = ({
  shortcuts,
  context,
  onSendShortcut,
}) => {
  const showSettingModal = useSettingModal()
  const { t } = useTranslation("ai")
  const enabledShortcuts = shortcuts.filter((shortcut) => shortcut.enabled)
  const emptyMessage =
    context === "entry"
      ? t("shortcuts.context_menu.empty.entry")
      : t("shortcuts.context_menu.empty.list")

  return (
    <DropdownMenuContent align="start">
      {enabledShortcuts.length === 0 ? (
        <div className="p-3 text-center text-xs text-text-tertiary">{emptyMessage}</div>
      ) : (
        enabledShortcuts.map((shortcut) => (
          <DropdownMenuItem
            key={shortcut.id}
            onClick={() => onSendShortcut?.(getShortcutEffectivePrompt(shortcut))}
          >
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
        <span>{t("shortcuts.manage")}</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
