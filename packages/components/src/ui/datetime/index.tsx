import { stopPropagation } from "@follow/utils/dom"
import dayjs from "dayjs"
import type { FC } from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from "../tooltip"

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

export const getUpdateInterval = (date: string | Date, relativeBeforeDay?: number) => {
  if (!relativeBeforeDay) return null
  const diffInSeconds = Math.abs(dayjs(date).diff(new Date(), "second"))
  if (diffInSeconds <= 60) {
    return 1000 // Update every second
  }
  const diffInMinutes = Math.abs(dayjs(date).diff(new Date(), "minute"))
  if (diffInMinutes <= 60) {
    return 60000 // Update every minute
  }
  const diffInHours = Math.abs(dayjs(date).diff(new Date(), "hour"))
  if (diffInHours <= 24) {
    return 3600000 // Update every hour
  }
  const diffInDays = Math.abs(dayjs(date).diff(new Date(), "day"))
  if (diffInDays <= relativeBeforeDay) {
    return 86400000 // Update every day
  }
  return null // No need to update
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
  }, [props.date, displayAbsoluteTimeAfterDay, nextDateFormatTemplate])
  const formated = dayjs(props.date).format(nextDateFormatTemplate)

  const { t } = useTranslation("common")
  if (formated === relative) {
    return <>{relative}</>
  }
  return (
    <Tooltip>
      {/* https://github.com/radix-ui/primitives/issues/2248#issuecomment-2147056904 */}
      <TooltipTrigger onFocusCapture={stopPropagation}>
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
