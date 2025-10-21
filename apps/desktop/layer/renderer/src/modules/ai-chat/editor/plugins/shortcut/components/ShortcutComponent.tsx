import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import * as React from "react"

import { useAISettingValue } from "~/atoms/settings/ai"

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
    <Tooltip>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <MentionLikePill
            className={className}
            variant="command"
            icon={
              matched?.icon ? (
                <i className={matched.icon} />
              ) : (
                <i className="i-mgc-hotkey-cute-re" />
              )
            }
            prefix="/"
            data-shortcut-id={shortcutData.id}
            onClick={handleClick}
          >
            {shortcutData.name}
          </MentionLikePill>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" className="max-w-[320px]">
            <div className="flex flex-col gap-1 p-1">
              <div className="flex items-center gap-1.5">
                <span className="text-text-tertiary font-mono text-xs">/</span>
                <span className="text-text text-sm font-medium">{shortcutData.name}</span>
              </div>

              {shortcutData.prompt ? (
                <span className="text-text-secondary text-xs leading-snug">
                  {shortcutData.prompt}
                </span>
              ) : null}
            </div>
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </Tooltip>
  )
}

ShortcutComponent.displayName = "ShortcutComponent"
