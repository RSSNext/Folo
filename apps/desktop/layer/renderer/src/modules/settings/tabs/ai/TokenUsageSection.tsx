import { Progress } from "@follow/components/ui/progress/index.jsx"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { apiFetch } from "~/lib/api-fetch"

import { SettingDescription } from "../../control"

const useTokenUsage = () => {
  return useQuery({
    queryKey: ["aiTokenUsage"],
    queryFn: async () => {
      // TODO: replace with api client call
      return (
        (await apiFetch("/ai/usage")) as {
          code: 0
          data: {
            total: number
            used: number
            remaining: number
            resetAt: string
          }
        }
      ).data
    },
  })
}

export const TokenUsageSection = () => {
  const { t } = useTranslation("ai")

  const tokenUsage = useTokenUsage().data || {
    total: 0,
    used: 0,
    remaining: 0,
    resetAt: new Date(),
  }

  const usagePercentage = tokenUsage.total === 0 ? 0 : (tokenUsage.used / tokenUsage.total) * 100
  const resetDate = new Date(tokenUsage.resetAt)

  return (
    <div className="space-y-4">
      <SettingDescription>{t("token_usage.description")}</SettingDescription>

      <div className="bg-material-medium border-border space-y-4 rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-text text-sm font-medium">
              {t("token_usage.tokens_used", {
                used: tokenUsage.used.toLocaleString(),
                total: tokenUsage.total.toLocaleString(),
              })}
            </p>
            <p className="text-text-secondary text-xs">
              {tokenUsage.remaining.toLocaleString()} {t("token_usage.tokens_remaining")}
            </p>
          </div>

          <div className="text-right">
            <div className="text-text text-sm font-medium">{Math.round(usagePercentage)}%</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={usagePercentage} className="h-2" />

          <div className="text-text-tertiary flex items-center justify-between text-xs">
            <span>0</span>
            <span>
              {t("token_usage.resets_at")}: {resetDate.toLocaleDateString()}
            </span>
            <span>{tokenUsage.total.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <div className="bg-accent size-3 rounded-full" />
          <span className="text-text-secondary text-xs">Current usage</span>
        </div>
      </div>
    </div>
  )
}
