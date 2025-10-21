import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import * as React from "react"

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
  const handleClick = React.useCallback(() => {
    onSelect?.(shortcutData)
  }, [onSelect, shortcutData])

  return (
    <Tooltip>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <MentionLikePill
            className={className}
            icon={
              <span className="bg-blue/10 text-blue inline-flex size-4 items-center justify-center rounded-full text-[11px] font-semibold leading-none">
                #
              </span>
            }
            data-shortcut-id={shortcutData.id}
            onClick={handleClick}
          >
            {shortcutData.name}
          </MentionLikePill>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" className="max-w-[320px]">
            <div className="flex flex-col gap-1 p-1">
              <span className="text-text text-sm font-medium">{shortcutData.name}</span>

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
