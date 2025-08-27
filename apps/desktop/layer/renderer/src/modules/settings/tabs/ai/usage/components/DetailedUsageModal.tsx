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
        <div className="text-text-secondary text-sm">{t("usage_analysis.no_data")}</div>
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
  const avgDaily =
    dailyTotals.length > 0
      ? Math.round(dailyTotals.reduce((a, b) => a + b, 0) / dailyTotals.length)
      : 0
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

  return (
    <div className="max-h-[80vh] min-h-[640px] w-[500px] max-w-full space-y-6 overflow-y-auto">
      <p className="text-text-secondary text-sm">
        {t("usage_analysis.detailed_description", {
          defaultValue: "Track your AI token usage, patterns, and efficiency.",
        })}
      </p>

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
          <div className="from-material-opaque/40 to-material-opaque/60 col-span-2 flex items-center justify-center rounded-xl bg-gradient-to-br p-6">
            <UsageProgressRing percentage={usagePercentage} size={130} />
          </div>
          <div className="col-span-3 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-fill-secondary/40 rounded-lg p-4">
                <Metric
                  label={t("usage_analysis.tokens_used")}
                  value={formatTokenCount(usage.used).value}
                  unit={formatTokenCount(usage.used).unit}
                />
              </div>
              <div className="bg-fill-secondary/40 rounded-lg p-4">
                <Metric
                  label={t("usage_analysis.tokens_remaining")}
                  value={formatTokenCount(rateLimit.remainingTokens).value}
                  unit={formatTokenCount(rateLimit.remainingTokens).unit}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-fill-secondary/20 rounded-lg p-3">
                <StatCompact
                  label={t("usage_analysis.total_limit")}
                  value={formatTokenCount(usage.total).value}
                  unit={formatTokenCount(usage.total).unit}
                />
              </div>
              <div className="bg-fill-secondary/20 rounded-lg p-3">
                <StatCompact
                  label={t("usage_analysis.resets_in")}
                  value={formatTimeRemaining(rateLimit.windowResetTime - Date.now())}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border-fill-tertiary bg-fill-secondary/10 rounded-lg border p-4">
            <StatCompact
              label={t("analytics.avg_per_day", { defaultValue: "Avg/day" })}
              value={formatTokenCount(avgDaily).value}
              unit={formatTokenCount(avgDaily).unit}
            />
          </div>
          <div className="border-fill-tertiary bg-fill-secondary/10 rounded-lg border p-4">
            <StatCompact
              label={t("analytics.peak_day", { defaultValue: "Peak day" })}
              value={peakDay?.date ? new Date(peakDay.date).toLocaleDateString() : "-"}
              hint={
                peakDay?.peakHour != null
                  ? t("analytics.at_hour", { defaultValue: "@ {{h}}:00", h: peakDay.peakHour })
                  : undefined
              }
            />
          </div>
        </div>
      </div>
      <Tabs defaultValue="overview" className="relative flex h-[400px] flex-col space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t("analytics.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="patterns">{t("analytics.tabs.patterns")}</TabsTrigger>
          <TabsTrigger value="efficiency">{t("analytics.tabs.efficiency")}</TabsTrigger>
          <TabsTrigger value="history">{t("analytics.tabs.history")}</TabsTrigger>
        </TabsList>

        <TabsScrollAreaContent className="h-0 grow" value="overview">
          <OverviewTab dailyTotals={dailyTotals} peakDay={peakDay} />
        </TabsScrollAreaContent>

        <TabsScrollAreaContent className="h-0 grow" value="patterns">
          <PatternsTab
            hourBuckets={hourBuckets}
            maxHourCount={maxHourCount}
            byOperation={byOperation}
          />
        </TabsScrollAreaContent>

        <TabsScrollAreaContent className="h-0 grow" value="efficiency">
          <EfficiencyTab byModel={byModel} />
        </TabsScrollAreaContent>

        <TabsScrollAreaContent className="h-0 grow" value="history">
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
      <div className="text-text-secondary text-[11px] uppercase tracking-wide">{label}</div>
      <div className="text-text text-lg font-semibold">
        {value}
        {unit ? <span className="text-text-tertiary ml-1 text-sm">{unit}</span> : null}
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
      <div className="text-text-secondary mb-1 text-[11px] uppercase tracking-wide">{label}</div>
      <div className="text-text text-base font-medium">
        {value}
        {unit ? <span className="text-text-tertiary ml-1 text-xs">{unit}</span> : null}
      </div>
      {hint ? <div className="text-text-tertiary mt-0.5 text-[11px]">{hint}</div> : null}
    </div>
  )
}
