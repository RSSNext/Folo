import { stopPropagation } from "@follow/utils/dom"
import dayjs from "dayjs"
import type { FC } from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from "../tooltip"
import { getUpdateInterval } from "./utils"

const formatTemplateString = "lll"

const formatTime = (
  date: string | Date,
  relativeBeforeDay?: number,
  template = formatTemplateString,
) => {
  if (relativeBeforeDay && Math.abs(dayjs(date).diff(new Date(), "d")) > relativeBeforeDay) {
    return dayjs(date).format(template)
  }
  return dayjs.duration(dayjs(date).diff(dayjs(), "minute"), "minute").humanize()
}

export const RelativeTime: FC<{
  date: string | Date
  displayAbsoluteTimeAfterDay?: number
  dateFormatTemplate?: string
}> = (props) => {
  const { displayAbsoluteTimeAfterDay = 29, dateFormatTemplate = formatTemplateString } = props
  const nextDateFormatTemplate =
    dateFormatTemplate === "default" ? formatTemplateString : dateFormatTemplate
  const [relative, setRelative] = useState<string>(() =>
    formatTime(props.date, displayAbsoluteTimeAfterDay, nextDateFormatTemplate),
  )

  const timerRef = useRef<any>(null)

  const { i18n } = useTranslation("common")

  useEffect(() => {
    const updateRelativeTime = () => {
      setRelative(formatTime(props.date, displayAbsoluteTimeAfterDay, nextDateFormatTemplate))
      const updateInterval = getUpdateInterval(props.date, displayAbsoluteTimeAfterDay)

      if (updateInterval !== null) {
        timerRef.current = setTimeout(updateRelativeTime, updateInterval)
      }
    }

    updateRelativeTime()

    return () => {
      clearTimeout(timerRef.current)
    }
  }, [props.date, displayAbsoluteTimeAfterDay, nextDateFormatTemplate, i18n.language])
  const formated = dayjs(props.date).format(nextDateFormatTemplate)

  const { t } = useTranslation("common")
  if (formated === relative) {
    return <>{relative}</>
  }
  return (
    <Tooltip>
      {/* https://github.com/radix-ui/primitives/issues/2248#issuecomment-2147056904 */}
      <TooltipTrigger tabIndex={-1} onFocusCapture={stopPropagation}>
        {relative}
        {t("space")}
        {t("words.ago")}
      </TooltipTrigger>

      <TooltipPortal>
        <TooltipContent>{formated}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
