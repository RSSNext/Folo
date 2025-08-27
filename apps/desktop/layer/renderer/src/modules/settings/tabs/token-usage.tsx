import { Progress } from "@follow/components/ui/progress/index.jsx"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@follow/components/ui/table/index.jsx"
import { cn } from "@follow/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { pick } from "es-toolkit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { followClient } from "~/lib/api-client"

import { SettingDescription } from "../control"

const useTokenUsage = () => {
  return useQuery({
    queryKey: ["aiTokenUsage"],
    queryFn: async () => {
      const res = await followClient.api.ai.config()
      return pick(res, ["usage", "usageHistory"])
    },
  })
}

// Format large numbers with appropriate units
const formatTokenCount = (count: number): { value: string; unit: string } => {
  if (count >= 1_000_000) {
    return { value: (count / 1_000_000).toFixed(1), unit: "M" }
  }
  if (count >= 1_000) {
    return { value: (count / 1_000).toFixed(1), unit: "K" }
  }
  return { value: count.toString(), unit: "" }
}

// Format percentage for display
const formatPercentage = (percentage: number): string => {
  return percentage < 1 && percentage > 0 ? "<1" : Math.round(percentage).toString()
}

const TokenUsageSection = () => {
  const { t } = useTranslation("ai")

  const { usage: tokenUsage, usageHistory } = useTokenUsage().data || {
    usage: {
      total: 0,
      used: 0,
      remaining: 0,
      resetAt: new Date(),
    },
    usageHistory: [],
  }

  const usagePercentage = tokenUsage.total === 0 ? 0 : (tokenUsage.used / tokenUsage.total) * 100
  const resetDate = useMemo(() => new Date(tokenUsage.resetAt), [tokenUsage.resetAt])

  const usedFormatted = useMemo(() => formatTokenCount(tokenUsage.used), [tokenUsage.used])
  const totalFormatted = useMemo(() => formatTokenCount(tokenUsage.total), [tokenUsage.total])
  const remainingFormatted = useMemo(
    () => formatTokenCount(tokenUsage.remaining),
    [tokenUsage.remaining],
  )

  return (
    <div className="space-y-6">
      <SettingDescription>{t("token_usage.description")}</SettingDescription>

      {/* Usage Overview */}
      <div className="space-y-6">
        {/* Main Usage Display */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Token Usage</h3>
            <span className="font-mono text-2xl text-gray-900">
              {formatPercentage(usagePercentage)}%
            </span>
          </div>

          <div className="space-y-3">
            <Progress value={usagePercentage} className="h-2" />
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {usedFormatted.value}
                {usedFormatted.unit} of {totalFormatted.value}
                {totalFormatted.unit} tokens used
              </span>
              <span>
                {remainingFormatted.value}
                {remainingFormatted.unit} remaining
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-600">Used</div>
            <div className="mt-1 font-mono text-xl text-gray-900">
              {usedFormatted.value}
              <span className="text-sm text-gray-500">{usedFormatted.unit}</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-600">Total</div>
            <div className="mt-1 font-mono text-xl text-gray-900">
              {totalFormatted.value}
              <span className="text-sm text-gray-500">{totalFormatted.unit}</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-600">Resets</div>
            <div className="mt-1 font-mono text-sm text-gray-900">
              {resetDate.toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: resetDate.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Usage History */}
      {usageHistory && usageHistory.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-lg font-medium text-gray-900">Usage History</h3>
            <p className="mt-1 text-sm text-gray-600">Recent token usage activity</p>
          </div>

          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 hover:bg-transparent">
                  <TableHead className="text-gray-900">Change</TableHead>
                  <TableHead className="text-gray-900">Description</TableHead>
                  <TableHead className="text-right text-gray-900">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usageHistory.map((entry, index) => (
                  <TableRow key={entry.id || index} className="border-gray-200 hover:bg-gray-50">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-6 items-center justify-center rounded text-xs font-medium",
                            entry.changes > 0
                              ? "bg-green-100 text-green-700"
                              : entry.changes < 0
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700",
                          )}
                        >
                          {entry.changes > 0 ? "+" : entry.changes < 0 ? "−" : "="}
                        </div>
                        <span className="font-mono text-sm text-gray-900">
                          {entry.changes > 0
                            ? `+${entry.changes.toLocaleString()}`
                            : entry.changes.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="text-sm text-gray-900">{entry.comment || ""}</span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <span className="font-mono text-sm text-gray-600">
                        {new Date(entry.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

export const SettingTokenUsage = () => {
  return (
    <div className="mt-4">
      <TokenUsageSection />
    </div>
  )
}
