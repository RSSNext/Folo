import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils/utils"
import type { ReactNode } from "react"

export const PeekModalBaseButton = ({
  onClick,
  className,
  label,
  icon,
}: {
  onClick: () => void
  className?: string
  label: string
  icon: ReactNode
}) => {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(
          "no-drag-region center bg-background flex size-8 rounded-full p-1 shadow-sm ring-1 ring-zinc-200 dark:ring-neutral-800",
          className,
        )}
        onClick={onClick}
      >
        {icon}
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
