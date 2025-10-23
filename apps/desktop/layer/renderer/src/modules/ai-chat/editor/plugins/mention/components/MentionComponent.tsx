import { DateTimePicker } from "@follow/components/ui/input/index.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipRoot,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { getView } from "@follow/constants"
import { cn } from "@follow/utils"
import dayjs from "dayjs"
import type { LexicalEditor } from "lexical"
import { $getNodeByKey } from "lexical"
import * as React from "react"
import { useTranslation } from "react-i18next"

import { MentionLikePill } from "../../shared/components/MentionLikePill"
import {
  createDateMentionData,
  getDateMentionDisplayName,
  parseRangeValue,
} from "../hooks/dateMentionUtils"
import { $isMentionNode } from "../MentionNode"
import type { MentionData } from "../types"
import { getMentionDisplayTextValue } from "../utils/mentionTextValue"
import { MentionTypeIcon } from "./shared/MentionTypeIcon"

interface MentionComponentProps {
  mentionData: MentionData
  className?: string
  nodeKey?: string
  editor?: LexicalEditor
}

const MentionTooltipContent = ({ mentionData }: { mentionData: MentionData }) => {
  const { t, i18n } = useTranslation("ai")
  const language = i18n.language || i18n.resolvedLanguage || "en"
  const displayValue = getMentionDisplayTextValue(mentionData, t, language)

  const getIconBgColor = () => {
    if (mentionData.type === "view" && typeof mentionData.value === "number") {
      const viewDef = getView(mentionData.value)
      if (viewDef?.backgroundClassName) {
        return viewDef.backgroundClassName
      }
    }

    switch (mentionData.type) {
      case "entry": {
        return "bg-blue"
      }
      case "feed": {
        return "bg-orange"
      }
      case "date": {
        return "bg-purple"
      }
    }
  }

  return (
    <div className="flex items-start gap-2 p-1">
      <div
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded text-white",
          getIconBgColor(),
        )}
      >
        <MentionTypeIcon type={mentionData.type} value={mentionData.value} className="size-3" />
      </div>
      <span className="text-sm text-text">{displayValue}</span>
    </div>
  )
}

const getMentionStyles = (mentionData: MentionData) => {
  const { type, value } = mentionData
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
      const viewDef = getView(value as number)
      return cn(baseStyles, viewDef!.mentionClassName)
    }
  }
}

export const MentionComponent: React.FC<MentionComponentProps> = ({
  mentionData,
  className,
  nodeKey,
  editor,
}) => {
  const { t, i18n } = useTranslation("ai")
  const language = i18n.language || i18n.resolvedLanguage || "en"

  const displayName = React.useMemo(() => {
    if (mentionData.type === "date") {
      return getDateMentionDisplayName(mentionData, t, language)
    }
    return `@${mentionData.name}`
  }, [mentionData, t, language])

  const handleDateRangeChange = React.useCallback(
    (value: { start?: string; end?: string }) => {
      if (!nodeKey || !value.start || !value.end || !editor) return

      const startDate = dayjs(value.start).startOf("day")
      const endDate = dayjs(value.end).startOf("day")
      const range = { start: startDate, end: endDate }

      const newMentionData = createDateMentionData({
        range,
        translate: t,
      })

      editor.update(() => {
        const node = $getNodeByKey(nodeKey)
        if ($isMentionNode(node)) {
          node.setMentionData(newMentionData)
        }
      })
    },
    [nodeKey, editor, t],
  )

  const currentDateRange = React.useMemo(() => {
    if (mentionData.type !== "date" || typeof mentionData.value !== "string") {
      return
    }
    const range = parseRangeValue(mentionData.value)
    if (!range) return

    return {
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    }
  }, [mentionData])

  const mentionSpan = (
    <TooltipTrigger asChild>
      <MentionLikePill
        className={cn(getMentionStyles(mentionData), className)}
        icon={
          <MentionTypeIcon type={mentionData.type} value={mentionData.value} className="size-3" />
        }
      >
        {displayName}
      </MentionLikePill>
    </TooltipTrigger>
  )

  const isEditableDateMention = mentionData.type === "date" && nodeKey && editor

  return (
    <Tooltip>
      <TooltipRoot>
        {isEditableDateMention ? (
          <DateTimePicker
            mode="range"
            rangeValue={currentDateRange}
            onRangeChange={handleDateRangeChange}
            minDate={dayjs().subtract(1, "month").toISOString()}
          >
            {mentionSpan}
          </DateTimePicker>
        ) : (
          mentionSpan
        )}
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
