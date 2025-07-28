import dayjs from "dayjs"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import type { TextProps } from "react-native"

import { Text } from "@/src/components/ui/typography/Text"

import { NativePressable } from "../pressable/NativePressable"

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

const getUpdateInterval = (date: string | Date, relativeBeforeDay?: number) => {
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

interface RelativeDateTimeProps extends TextProps {
  date: string | Date
  displayAbsoluteTimeAfterDay?: number
  dateFormatTemplate?: string
  postfixText?: string
}

export const RelativeDateTime = ({
  date,
  displayAbsoluteTimeAfterDay = Infinity,
  dateFormatTemplate,
  postfixText,
  ...props
}: RelativeDateTimeProps) => {
  const { t } = useTranslation("common")
  const [relative, setRelative] = useState<string>(() =>
    formatTime(date, displayAbsoluteTimeAfterDay, dateFormatTemplate),
  )

  const memoizedFormatTime = useMemo(() => {
    return dayjs(date).format(dateFormatTemplate ?? formatTemplateString)
  }, [date, dateFormatTemplate])
  const [mode, setMode] = useState<"relative" | "absolute">("relative")
  useEffect(() => {
    if (mode === "absolute") return
    if (!displayAbsoluteTimeAfterDay) return
    setRelative(formatTime(date, displayAbsoluteTimeAfterDay, dateFormatTemplate))
    const interval = setInterval(
      () => {
        setRelative(formatTime(date, displayAbsoluteTimeAfterDay, dateFormatTemplate))
      },
      getUpdateInterval(date, displayAbsoluteTimeAfterDay) ?? 1000,
    )
    return () => clearInterval(interval)
  }, [date, displayAbsoluteTimeAfterDay, dateFormatTemplate, mode])

  return (
    <NativePressable
      hitSlop={10}
      onPress={() => {
        setMode((mode) => (mode === "relative" ? "absolute" : "relative"))
      }}
    >
      <Text {...props} key={mode}>
        {mode === "relative"
          ? `${relative}${t("space")}${postfixText ?? t("words.ago")}`
          : memoizedFormatTime}
      </Text>
    </NativePressable>
  )
}
