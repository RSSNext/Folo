import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils"
import * as React from "react"

import type { MentionData } from "../types"
import { MentionTypeIcon } from "./shared/MentionTypeIcon"

interface MentionComponentProps {
  mentionData: MentionData
  className?: string
}

const MentionTooltipContent = ({ mentionData }: { mentionData: MentionData }) => (
  <div className="flex items-center gap-2">
    <div className="bg-fill border-fill-secondary flex size-6 flex-shrink-0 items-center justify-center rounded-full border">
      <MentionTypeIcon type={mentionData.type} />
    </div>
    <div className="flex flex-col gap-1">
      <p className="text-text text-sm font-medium">@{mentionData.name}</p>
      <span
        className={cn(
          "rounded px-1.5 py-0.5 text-xs font-medium",
          mentionData.type === "entry" && "bg-blue text-black",
          mentionData.type === "feed" && "bg-orange text-black",
        )}
      >
        {mentionData.type}
      </span>
    </div>
  </div>
)

const getMentionStyles = (type: MentionData["type"]) => {
  const baseStyles = tw`
    inline-flex items-center gap-1 px-2 py-0.5 rounded-md
    font-medium text-sm cursor-pointer select-none
  `

  switch (type) {
    case "entry": {
      return cn(
        baseStyles,
        "bg-blue/10 text-blue border-blue/20",
        "hover:bg-blue/20 hover:border-blue/30",
      )
    }
    case "feed": {
      return cn(
        baseStyles,
        "bg-orange/10 text-orange border-orange/20",
        "hover:bg-orange/20 hover:border-orange/30",
      )
    }
  }
}
export const MentionComponent: React.FC<MentionComponentProps> = ({ mentionData, className }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Handle mention click - could navigate to user profile, topic page, etc.
    // TODO: Implement navigation logic for mentions
  }

  return (
    <Tooltip>
      <TooltipRoot>
        <TooltipTrigger asChild>
          <span className={cn(getMentionStyles(mentionData.type), className)} onClick={handleClick}>
            <MentionTypeIcon type={mentionData.type} />
            <span>@{mentionData.name}</span>
          </span>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" className="max-w-[300px]">
            <MentionTooltipContent mentionData={mentionData} />
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </Tooltip>
  )
}

MentionComponent.displayName = "MentionComponent"
