import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import type { ReactNode } from "react"

export interface ShortcutTooltipProps {
  name: string
  prompt?: string
  hotkey?: string
  children: ReactNode
  asChild?: boolean
}

export const ShortcutTooltip: React.FC<ShortcutTooltipProps> = ({
  name,
  prompt,
  hotkey,
  children,
  asChild = true,
}) => {
  return (
    <Tooltip>
      <TooltipRoot>
        <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" className="max-w-[320px]">
            <div className="flex flex-col gap-1 p-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs text-text-tertiary">/</span>
                <span className="text-sm font-medium text-text">{name}</span>
                {hotkey && (
                  <span className="ml-auto font-mono text-xs text-text-tertiary">{hotkey}</span>
                )}
              </div>

              {prompt && <span className="text-xs leading-snug text-text-secondary">{prompt}</span>}
            </div>
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </Tooltip>
  )
}

ShortcutTooltip.displayName = "ShortcutTooltip"
