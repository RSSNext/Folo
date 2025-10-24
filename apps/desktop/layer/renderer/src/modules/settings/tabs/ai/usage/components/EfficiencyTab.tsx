import { Card, CardContent, CardHeader, CardTitle } from "@follow/components/ui/card/index.jsx"
import type { ModelPattern } from "@follow-app/client-sdk"
import { useTranslation } from "react-i18next"

import { formatTokenCount, formatTokenCountString } from "../utils"
import { BarList } from "./charts"

interface EfficiencyTabProps {
  byModel: ModelPattern[]
}

export const EfficiencyTab = ({ byModel }: EfficiencyTabProps) => {
  const { t } = useTranslation("ai")

  return (
    <Card className="mx-4">
      <CardHeader>
        <CardTitle className="text-base text-text">
          {t("analytics.efficiency_analysis", { defaultValue: "Efficiency analysis" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {byModel?.length > 0 ? (
          <BarList
            data={byModel.map((m) => {
              const formatted = formatTokenCount(m.totalTokens ?? 0)
              return {
                label: m.model ?? "unknown",
                value: m.avgEfficiency || 0,
                right: `${formatted.value}${formatted.unit}`,
              }
            })}
            format={(v) => formatTokenCountString(v)}
          />
        ) : (
          <div className="py-8 text-center text-sm text-text-tertiary">
            {t("analytics.no_data")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
