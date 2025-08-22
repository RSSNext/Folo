import { Button } from "@follow/components/ui/button/index.js"
import { KbdCombined } from "@follow/components/ui/kbd/Kbd.js"
import { Switch } from "@follow/components/ui/switch/index.jsx"
import type { AIShortcut } from "@follow/shared/settings/interface"

interface ShortcutItemProps {
  shortcut: AIShortcut
  onDelete: (id: string) => void
  onToggle: (id: string, enabled: boolean) => void
  onEdit: (shortcut: AIShortcut) => void
}

export const ShortcutItem = ({ shortcut, onDelete, onToggle, onEdit }: ShortcutItemProps) => {
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

        <div className="ml-4 flex items-center gap-3">
          <div className="flex items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="sm" onClick={() => onEdit(shortcut)}>
              <i className="i-mgc-edit-cute-re size-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(shortcut.id)}>
              <i className="i-mgc-delete-2-cute-re size-4" />
            </Button>
          </div>

          <div className="border-fill-tertiary flex items-center gap-2 border-l pl-3">
            <span className="text-text-tertiary text-xs font-medium">
              {shortcut.enabled ? "ON" : "OFF"}
            </span>
            <Switch
              checked={shortcut.enabled}
              onCheckedChange={(enabled) => onToggle(shortcut.id, enabled)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
