import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { RANGE_WITH_LABEL_KEY } from "../hooks/dateMentionConfig"
import { getDateMentionDisplayName } from "../hooks/dateMentionUtils"
import type { MentionData } from "../types"
import { MentionTypeIcon } from "./shared/MentionTypeIcon"

interface MentionComponentProps {
  mentionData: MentionData
  className?: string
}

const MentionTooltipContent = ({
  mentionData,
  displayName,
}: {
  mentionData: MentionData
  displayName: string
}) => (
  <div className="flex items-center gap-2 p-1">
    <div
      className={cn(
        "flex size-5 items-center justify-center rounded text-white",
        mentionData.type === "entry" && "bg-blue",
        mentionData.type === "feed" && "bg-orange",
        mentionData.type === "date" && "bg-purple",
        mentionData.type === "shortcut" && "bg-amber-700",
      )}
    >
      <MentionTypeIcon type={mentionData.type} value={mentionData.value} className="size-3" />
    </div>
    <span className="text-text text-sm">{displayName}</span>
  </div>
)

const getMentionStyles = (type: MentionData["type"]) => {
  const baseStyles = tw`
    inline items-center gap-1 px-2 py-0.5 rounded-md
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
    case "category": {
      return cn(
        baseStyles,
        "bg-green/10 text-green border-green/20",
        "hover:bg-green/20 hover:border-green/30",
      )
    }
    case "date": {
      return cn(
        baseStyles,
        "bg-purple/10 text-purple border-purple/20",
        "hover:bg-purple/20 hover:border-purple/30",
      )
    }
    case "view": {
      return cn(baseStyles)
    }
    case "shortcut": {
      return cn(baseStyles, "text-amber-700 border-amber-700/20", "hover:border-amber-700/30")
    }
  }
}
export const MentionComponent: React.FC<MentionComponentProps> = ({ mentionData, className }) => {
  const { t, i18n } = useTranslation("ai")
  const language = i18n.language || i18n.resolvedLanguage || "en"

  const displayName = React.useMemo(() => {
    if (mentionData.type === "date") {
      return getDateMentionDisplayName(mentionData, t, language, RANGE_WITH_LABEL_KEY)
    }
    if (mentionData.type === "shortcut") {
      return mentionData.name
    } else {
      return `@${mentionData.name}`
    }
  }, [mentionData, t, language])

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
            <MentionTypeIcon
              type={mentionData.type}
              value={mentionData.value}
              className="mr-1 translate-y-[2px]"
            />
            <span>{displayName}</span>
          </span>
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent side="top" className="max-w-[300px]">
            <MentionTooltipContent mentionData={mentionData} displayName={displayName} />
          </TooltipContent>
        </TooltipPortal>
      </TooltipRoot>
    </Tooltip>
  )
}

MentionComponent.displayName = "MentionComponent"
