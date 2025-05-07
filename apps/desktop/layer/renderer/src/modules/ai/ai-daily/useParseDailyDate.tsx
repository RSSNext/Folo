import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { DayOf } from "./constants"

export const useParseDailyDate = (day: DayOf) => {
  const { t } = useTranslation("common")

  return useMemo(() => {
    const dateObj = new Date()

    const nowHour = dateObj.getHours()
    let startDate: number
    let endDate: number
    let title: string

    const today8AM = dateObj.setHours(8, 0, 0, 0)
    const today8PM = dateObj.setHours(20, 0, 0, 0)
    dateObj.setDate(dateObj.getDate() - 1)
    const yesterday8AM = dateObj.setHours(8, 0, 0, 0)
    const yesterday8PM = dateObj.setHours(20, 0, 0, 0)
    dateObj.setDate(dateObj.getDate() - 1)
    const dayBeforeYesterday8PM = dateObj.setHours(20, 0, 0, 0)

    const isToday = day === DayOf.Today
    // For index 0, get the last past 8 AM or 8 PM; for index 1, get the second last past 8 AM or 8 PM.
    if (nowHour >= 20) {
      if (isToday) {
        endDate = today8PM - 1
        startDate = today8AM
        title = t("time.today")
      } else {
        endDate = today8AM - 1
        startDate = yesterday8PM
        title = t("time.last_night")
      }
    } else if (nowHour >= 8) {
      if (isToday) {
        endDate = today8AM - 1
        startDate = yesterday8PM
        title = t("time.last_night")
      } else {
        endDate = yesterday8PM - 1
        startDate = yesterday8AM
        title = t("time.yesterday")
      }
    } else {
      if (isToday) {
        endDate = yesterday8PM - 1
        startDate = yesterday8AM
        title = t("time.yesterday")
      } else {
        endDate = yesterday8AM - 1
        startDate = dayBeforeYesterday8PM
        title = t("time.the_night_before_last")
      }
    }

    return { title, startDate, endDate }
  }, [day, t])
}
