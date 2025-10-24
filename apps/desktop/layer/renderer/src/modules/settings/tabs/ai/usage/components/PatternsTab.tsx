import { Card, CardContent, CardHeader, CardTitle } from "@follow/components/ui/card/index.jsx"
import type { UsagePattern } from "@follow-app/client-sdk"
import { useTranslation } from "react-i18next"

import { formatTokenCountString } from "../utils"
import { BarList, TinyBars } from "./charts"

interface PatternsTabProps {
  hourBuckets: number[]
  maxHourCount: number
  byOperation: UsagePattern[]
}

export const PatternsTab = ({ hourBuckets, maxHourCount, byOperation }: PatternsTabProps) => {
  const { t } = useTranslation("ai")

  return (
    <div className="mx-4 grid grid-cols-1 gap-4 @md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-text">
            {t("analytics.peak_hours", { defaultValue: "Peak hours" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 h-24 w-full">
            <TinyBars
              data={hourBuckets.map((v, h) => ({ label: String(h), value: v }))}
              max={maxHourCount}
              highlightThreshold={(v) => v >= Math.max(1, Math.round(maxHourCount * 0.6))}
            />
          </div>
          <div className="grid grid-cols-6 gap-1 text-[10px] text-text-tertiary">
            <span>00</span>
            <span>04</span>
            <span>08</span>
            <span>12</span>
            <span>16</span>
            <span>20</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-text">
            {t("analytics.by_operation", { defaultValue: "By operation" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {byOperation?.length > 0 ? (
            <BarList
              data={byOperation.map((o) => ({
                label: o.operationType ?? "unknown",
                value: o.percentage || 0,

                right: formatTokenCountString(o.totalTokens ?? 0),
              }))}
              suffix="%"
            />
          ) : (
            <div className="py-8 text-center text-sm text-text-tertiary">
              {t("analytics.no_data")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
