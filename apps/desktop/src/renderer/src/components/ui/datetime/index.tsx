import { getUpdateInterval } from "@follow/components/ui/datetime/utils.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { stopPropagation } from "@follow/utils/dom"
import dayjs from "dayjs"
import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGeneralSettingSelector } from "~/atoms/settings/general"

export { RelativeTime } from "@follow/components/ui/datetime/index.js"
const formatTemplateStringShort = "ll"

export const RelativeDay = ({ date }: { date: Date }) => {
  const { t } = useTranslation("common")
  const language = useGeneralSettingSelector((s) => s.language)

  const formatDateString = useCallback(
    (date: Date) => {
      const now = new Date()

      // Remove the time part for comparison
      const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const inputDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

      const diffTime = nowDate.getTime() - inputDate.getTime()
      const diffDays = diffTime / (1000 * 3600 * 24)

      if (diffDays === 0) {
        return t("time.today")
      } else if (diffDays === 1) {
        return t("time.yesterday")
      } else {
        let locale: Intl.Locale

        try {
          locale = new Intl.Locale(language.replace("_", "-"))
        } catch {
          locale = new Intl.Locale("en-US")
        }
        return date.toLocaleDateString(locale, {
          weekday: "long",
          month: "short",
          day: "numeric",
        })
      }
    },
    [t, language],
  )

  const timerRef = useRef<any>(null)
  const [dateString, setDateString] = useState<string>(() => formatDateString(date))

  useEffect(() => {
    const updateInterval = getUpdateInterval(date, 3)

    if (updateInterval !== null) {
      timerRef.current = setTimeout(() => {
        setDateString(formatDateString(date))
      }, updateInterval)
    } else {
      setDateString(formatDateString(date))
    }

    return () => {
      timerRef.current = clearTimeout(timerRef.current)
    }
  }, [date, formatDateString, language])

  const formated = dayjs(date).format(formatTemplateStringShort)
  if (formated === dateString) {
    return <>{dateString}</>
  }
  return (
    <Tooltip>
      <TooltipTrigger onFocusCapture={stopPropagation}>{dateString}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{formated}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}
