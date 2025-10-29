import { Card, CardContent } from "@follow/components/ui/card/index.jsx"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { useAIConfiguration } from "~/modules/ai-chat/hooks/useAIConfiguration"

import { DetailedUsageModal, UsageProgressRing, UsageWarningBanner } from "./components"
import { formatTokenCountString } from "./utils"

export const UsageAnalysisSection = () => {
  const { t } = useTranslation("ai")
  const { data: config, isLoading } = useAIConfiguration()

  const { present } = useModalStack()
  if (isLoading) {
    return <div className="h-36 animate-pulse rounded-lg bg-fill-secondary" />
  }
  if (!config) return null

  const { usage, rateLimit } = config
  const usagePercentage = usage.total === 0 ? 0 : (usage.used / usage.total) * 100

  return (
    <div className="-ml-3 space-y-4">
      {rateLimit?.warningLevel && rateLimit.warningLevel !== "safe" ? (
        <UsageWarningBanner
          level={rateLimit.warningLevel}
          projectedLimitTime={rateLimit.projectedLimitTime ?? null}
          usageRate={rateLimit.usageRate}
        />
      ) : null}

      <Card>
        <CardContent className="relative p-4">
          <div className="flex items-center gap-4">
            <UsageProgressRing percentage={usagePercentage} size="md" />

            <div className="flex-1 space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-text">
                  {formatTokenCountString(rateLimit.remainingTokens)}
                </span>
                <span className="text-sm text-text-secondary">
                  {t("usage_analysis.tokens_remaining")}
                </span>
              </div>

              <div className="text-xs text-text-tertiary">
                {formatTokenCountString(usage.used)} / {formatTokenCountString(usage.total)} used
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              present({
                id: "detailed-usage-modal",
                content: DetailedUsageModal,
                title: t("usage_analysis.detailed_title"),
                modalContentClassName: "-mx-6 -mb-4",
              })
            }
            className="absolute right-4 top-4 flex items-center gap-1 text-sm text-text-secondary duration-200 hover:text-text"
          >
            {t("usage_analysis.view_details")}
            <i className="i-mingcute-right-line" />
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
