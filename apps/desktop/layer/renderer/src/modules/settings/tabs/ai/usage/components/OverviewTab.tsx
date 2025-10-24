import { Card, CardContent, CardHeader, CardTitle } from "@follow/components/ui/card/index.jsx"
import type { DailyPattern } from "@follow-app/client-sdk"
import { useTranslation } from "react-i18next"

import { formatTokenCountString } from "../utils"
import { Sparkline } from "./charts"

interface OverviewTabProps {
  dailyTotals: number[]
  peakDay: DailyPattern | null
}

export const OverviewTab = ({ dailyTotals, peakDay }: OverviewTabProps) => {
  const { t } = useTranslation("ai")

  return (
    <div className="space-y-4 px-4">
      {dailyTotals.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-text">
              {t("analytics.usage_trends", { defaultValue: "Usage trends" })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-44 w-full">
              <Sparkline data={dailyTotals} area color="#60a5fa" />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-text-tertiary">
              <span>
                {t("analytics.points", { defaultValue: "Points" })}: {dailyTotals.length}
              </span>
              {peakDay?.date ? (
                <span>
                  <span>{t("analytics.peak", { defaultValue: "Peak" })}: </span>
                  <span>{formatTokenCountString(peakDay.totalTokens)}</span>
                  <span>{" · "}</span>
                  <span>{new Date(peakDay.date).toLocaleDateString()} </span>
                  <span>
                    {peakDay.peakHour != null
                      ? `@ ${String(peakDay.peakHour).padStart(2, "0")}:00`
                      : ""}
                  </span>
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex h-32 items-center justify-center">
            <div className="text-center text-sm text-text-secondary">{t("analytics.no_data")}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
