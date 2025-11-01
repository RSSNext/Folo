import {
  Tabs,
  TabsList,
  TabsScrollAreaContent,
  TabsTrigger,
} from "@follow/components/ui/tabs/index.js"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { followApi } from "~/lib/api-client"
import { useAIConfiguration } from "~/modules/ai-chat/hooks/useAIConfiguration"

import { formatTimeRemaining, formatTokenCount } from "../utils"
import { EfficiencyTab } from "./EfficiencyTab"
import { HistoryTab } from "./HistoryTab"
import { OverviewTab } from "./OverviewTab"
import { PatternsTab } from "./PatternsTab"
import { UsageProgressRing } from "./UsageProgressRing"
import { UsageWarningBanner } from "./UsageWarningBanner"

const useAIAnalysisData = () => {
  return useQuery({
    queryKey: ["ai-token-usage", "usage-history"],
    queryFn: () => {
      return followApi.aiAnalytics.get()
    },
  })
}

export const DetailedUsageModal = () => {
  const { t } = useTranslation("ai")
  const { data: config, isLoading: loadingConfig } = useAIConfiguration()

  const { data: analysis, isLoading: _loadingUsageHistory } = useAIAnalysisData()
  if (loadingConfig) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="i-mgc-loading-3-cute-re size-6 animate-spin" />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-sm text-text-secondary">{t("usage_analysis.no_data")}</div>
      </div>
    )
  }

  const { usage, rateLimit } = config
  const usagePercentage = usage.total === 0 ? 0 : (usage.used / usage.total) * 100

  // Build derived datasets for inline charts
  const daily = analysis?.patterns?.daily ?? []
  const byOperation = analysis?.patterns?.byOperation ?? []
  const byModel = analysis?.patterns?.byModel ?? []

  const dailyTotals = daily.map((d: any) => Number(d.totalTokens) || 0)

  const peakDay = daily.reduce(
    (acc: any, cur: any) => (cur.totalTokens > (acc?.totalTokens ?? -1) ? cur : acc),
    null,
  )

  // Peak-hour distribution from provided peakHour field on each day
  const hourBuckets = Array.from({ length: 24 }, () => 0)
  daily.forEach((d: any) => {
    if (d?.peakHour != null) {
      const h = Number(d.peakHour)
      if (Number.isFinite(h) && h >= 0 && h < 24) {
        hourBuckets[h]! += 1
      }
    }
  })
  const maxHourCount = Math.max(1, ...hourBuckets)

  const formattedUsageTokens = formatTokenCount(usage.used)
  const formattedRemainingTokens = formatTokenCount(rateLimit.remainingTokens)
  const formattedTotalTokens = formatTokenCount(usage.total)

  return (
    <div className="flex max-h-[80vh] min-h-[640px] w-[500px] max-w-full flex-col space-y-6 overflow-hidden">
      <div className="space-y-6 px-4">
        <p className="text-sm text-text-secondary">{t("usage_analysis.detailed_description")}</p>

        {rateLimit?.warningLevel && rateLimit.warningLevel !== "safe" && (
          <UsageWarningBanner
            level={rateLimit.warningLevel}
            projectedLimitTime={rateLimit.projectedLimitTime ?? null}
            usageRate={rateLimit.usageRate}
            detailed={true}
          />
        )}

        {/* Layout Option 4: Asymmetric Modern */}
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-2 flex items-center justify-center rounded-xl bg-fill-secondary/50 p-6">
              <UsageProgressRing percentage={usagePercentage} size={130} />
            </div>
            <div className="col-span-3 flex h-full flex-col gap-3">
              <div className="grid h-1/2 grid-cols-2 gap-4">
                <div className="rounded-lg bg-fill-secondary/50 p-4">
                  <Metric
                    label={t("usage_analysis.tokens_used")}
                    value={formattedUsageTokens.value}
                    unit={formattedUsageTokens.unit}
                  />
                </div>
                <div className="rounded-lg bg-fill-secondary/50 p-4">
                  <Metric
                    label={t("usage_analysis.total_credits")}
                    value={formattedTotalTokens.value}
                    unit={formattedTotalTokens.unit}
                  />
                </div>
              </div>
              <div className="grid h-1/2 grid-cols-2 gap-4">
                <div className="rounded-lg bg-fill-secondary/30 p-3">
                  <StatCompact
                    label={t("usage_analysis.window_remaining")}
                    value={formattedRemainingTokens.value}
                    unit={formattedRemainingTokens.unit}
                  />
                </div>
                <div className="rounded-lg bg-fill-secondary/30 p-3">
                  <StatCompact
                    label={t("usage_analysis.resets_in")}
                    value={formatTimeRemaining(rateLimit.windowResetTime - Date.now())}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Tabs defaultValue="overview" className="relative flex min-h-0 grow flex-col space-y-4">
        <TabsList className="grid w-full grid-cols-4 px-4">
          <TabsTrigger value="overview">{t("analytics.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="patterns">{t("analytics.tabs.patterns")}</TabsTrigger>
          <TabsTrigger value="efficiency">{t("analytics.tabs.efficiency")}</TabsTrigger>
          <TabsTrigger value="history">{t("analytics.tabs.history")}</TabsTrigger>
        </TabsList>

        <TabsScrollAreaContent className="h-0 grow" viewportClassName="pb-4" value="overview">
          <OverviewTab dailyTotals={dailyTotals} peakDay={peakDay} />
        </TabsScrollAreaContent>

        <TabsScrollAreaContent className="h-0 grow" viewportClassName="pb-4" value="patterns">
          <PatternsTab
            hourBuckets={hourBuckets}
            maxHourCount={maxHourCount}
            byOperation={byOperation}
          />
        </TabsScrollAreaContent>

        <TabsScrollAreaContent className="h-0 grow" viewportClassName="pb-4" value="efficiency">
          <EfficiencyTab byModel={byModel} />
        </TabsScrollAreaContent>

        <TabsScrollAreaContent className="h-0 grow" viewportClassName="pb-4" value="history">
          <HistoryTab analysis={analysis!} />
        </TabsScrollAreaContent>
      </Tabs>
    </div>
  )
}

// ------- UI bits: small utility components -------

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-text-secondary">{label}</div>
      <div className="text-lg font-semibold text-text">
        {value}
        {unit ? <span className="ml-1 text-sm text-text-tertiary">{unit}</span> : null}
      </div>
    </div>
  )
}

function StatCompact({
  label,
  value,
  unit,
  hint,
}: {
  label: string
  value: string
  unit?: string
  hint?: string
}) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wide text-text-secondary">{label}</div>
      <div className="text-base font-medium text-text">
        {value}
        {unit ? <span className="ml-1 text-xs text-text-tertiary">{unit}</span> : null}
      </div>
      {hint ? <div className="mt-0.5 text-[11px] text-text-tertiary">{hint}</div> : null}
    </div>
  )
}
