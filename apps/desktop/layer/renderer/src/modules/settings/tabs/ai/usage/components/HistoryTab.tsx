import { cn } from "@follow/utils/utils"
import type { AnalyticsData } from "@follow-app/client-sdk"
import { useTranslation } from "react-i18next"

import { RelativeTime } from "~/components/ui/datetime"

interface HistoryTabProps {
  analysis: AnalyticsData | null
}

export const HistoryTab = ({ analysis }: HistoryTabProps) => {
  const { t } = useTranslation("ai")

  if (!analysis || analysis.usageHistory.length === 0) {
    return (
      <div className="text-text-secondary text-center">
        <p className="text-sm">{t("analytics.no_history")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-4">
      <div className="bg-material-opaque sticky top-0 z-10 rounded-lg px-4 py-3">
        <div className="text-text-secondary grid grid-cols-[2fr_1fr_1fr] gap-4 text-xs font-medium">
          <div className="flex items-center gap-2">
            {t("analytics.event", { defaultValue: "Event" })}
          </div>
          <div className="flex items-center justify-center gap-2">
            {t("analytics.tokens", { defaultValue: "Tokens" })}
          </div>
          <div className="flex items-center justify-end gap-2">
            {t("analytics.time", { defaultValue: "Time" })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {analysis.usageHistory.slice(0, 20).map((item, index) => (
          <div className="grid grid-cols-[2fr_1fr_1fr] items-center gap-4" key={index}>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-text truncate text-sm font-medium">
                  {item.operationType
                    ? t("analytics.history_operation", {
                        operation: item.operationType,
                      })
                    : t("analytics.history_usage")}
                </span>
              </div>
            </div>

            <div className="flex justify-center">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium tabular-nums",
                  item.changes > 0 ? "bg-orange/10 text-orange" : "bg-green/10 text-green",
                )}
              >
                <span>{item.changes > 0 ? "+" : ""}</span>
                {item.changes.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-end">
              <span className="text-text-tertiary text-xs">
                <RelativeTime date={item.createdAt} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
