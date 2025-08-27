import { Card, CardContent } from "@follow/components/ui/card/index.jsx"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useAIConfiguration } from "~/modules/ai-chat/hooks/useAIConfiguration"

import { DetailedUsageModal, UsageProgressRing, UsageWarningBanner } from "./components"
import { formatTimeRemaining, formatTokenCountString } from "./utils"

export const UsageAnalysisSection = () => {
  const { t } = useTranslation("ai")
  const { data: config, isLoading } = useAIConfiguration()

  const { present } = useModalStack()
  if (isLoading) {
    return <div className="bg-fill-secondary h-36 animate-pulse rounded-lg" />
  }
  if (!config) return null

  const { usage, rateLimit } = config
  const usagePercentage = usage.total === 0 ? 0 : (usage.used / usage.total) * 100

  return (
    <div className="space-y-4">
      {rateLimit?.warningLevel && rateLimit.warningLevel !== "safe" ? (
        <UsageWarningBanner
          level={rateLimit.warningLevel}
          projectedLimitTime={rateLimit.projectedLimitTime ?? null}
          usageRate={rateLimit.usageRate}
        />
      ) : null}

      <Card>
        <CardContent className="h-36 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-text text-sm font-medium">{t("usage_analysis.title")}</h3>

            <button
              type="button"
              onClick={() =>
                present({
                  id: "detailed-usage-modal",
                  content: DetailedUsageModal,
                  title: t("usage_analysis.detailed_title"),
                })
              }
              className="text-text-secondary hover:text-text flex items-center gap-1 text-sm duration-200"
            >
              {t("usage_analysis.view_details")}
              <i className="i-mingcute-right-line" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <UsageProgressRing percentage={usagePercentage} size="md" />

            <div className="flex-1 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-text text-lg font-semibold">
                  {formatTokenCountString(rateLimit.remainingTokens)}
                </span>
                <span className="text-text-secondary text-sm">
                  {t("usage_analysis.tokens_remaining")}
                </span>
              </div>

              <div className="text-text-tertiary text-xs">
                {formatTokenCountString(usage.used)} / {formatTokenCountString(usage.total)} used
              </div>

              <div className="text-text-secondary text-xs">
                {t("usage_analysis.resets_in")}{" "}
                {formatTimeRemaining(rateLimit.windowResetTime - Date.now())}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
