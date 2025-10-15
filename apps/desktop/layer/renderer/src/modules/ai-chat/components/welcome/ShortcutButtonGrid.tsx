import { AIShortcutButton } from "@follow/components/ui/ai-shortcut-button/index.js"
import type { AIShortcut } from "@follow/shared/settings/interface"
import type { EditorState } from "lexical"
import { useMemo } from "react"

interface ShortcutButtonGridProps {
  shortcuts: AIShortcut[]
  onSend: (message: EditorState | string) => void
  onCustomize: () => void
  customizeLabel: string
  customizeTitle: string
  className?: string
  limit?: number
}

const baseClassName = "relative flex flex-wrap items-center justify-center gap-2"

export const ShortcutButtonGrid: React.FC<ShortcutButtonGridProps> = ({
  shortcuts,
  onSend,
  onCustomize,
  customizeLabel,
  customizeTitle,
  className,
  limit = 6,
}) => {
  const enabledShortcuts = useMemo(
    () => shortcuts.filter((shortcut) => shortcut.enabled),
    [shortcuts],
  )
  const displayShortcuts = useMemo(
    () => enabledShortcuts.slice(0, limit),
    [enabledShortcuts, limit],
  )
  const wrapperClassName = className ? `${baseClassName} ${className}` : baseClassName

  return (
    <div className={wrapperClassName}>
      {displayShortcuts.map((shortcut, index) => (
        <AIShortcutButton
          key={shortcut.id}
          onClick={() => onSend(shortcut.prompt)}
          animationDelay={index * 0.1}
          title={shortcut.hotkey ? `${shortcut.name} (${shortcut.hotkey})` : shortcut.name}
        >
          {shortcut.name}
        </AIShortcutButton>
      ))}

      {enabledShortcuts.length === 0 && (
        <AIShortcutButton
          key="customize-shortcuts"
          onClick={onCustomize}
          animationDelay={0}
          variant="outline"
          title={customizeTitle}
        >
          {customizeLabel}
        </AIShortcutButton>
      )}
    </div>
  )
}
