import * as React from "react"

import { useAISettingValue } from "~/atoms/settings/ai"

import { ShortcutTooltip } from "../../../../components/ui/ShortcutTooltip"
import { MentionLikePill } from "../../shared/components/MentionLikePill"
import type { ShortcutData } from "../types"

interface ShortcutComponentProps {
  shortcutData: ShortcutData
  className?: string
  onSelect?: (shortcut: ShortcutData) => void
}

export const ShortcutComponent: React.FC<ShortcutComponentProps> = ({
  shortcutData,
  className,
  onSelect,
}) => {
  const { shortcuts } = useAISettingValue()
  const matched = React.useMemo(() => {
    return shortcuts.find((s) => s.name === shortcutData.name)
  }, [shortcuts, shortcutData.name])
  const handleClick = React.useCallback(() => {
    onSelect?.(shortcutData)
  }, [onSelect, shortcutData])

  return (
    <ShortcutTooltip
      name={shortcutData.name}
      prompt={shortcutData.prompt || matched?.defaultPrompt}
    >
      <MentionLikePill
        className={className}
        variant="command"
        icon={
          matched?.icon ? <i className={matched.icon} /> : <i className="i-mgc-hotkey-cute-re" />
        }
        prefix="/"
        data-shortcut-id={shortcutData.id}
        onClick={handleClick}
      >
        {shortcutData.name}
      </MentionLikePill>
    </ShortcutTooltip>
  )
}

ShortcutComponent.displayName = "ShortcutComponent"
