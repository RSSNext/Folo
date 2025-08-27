import { Card, CardContent, CardHeader, CardTitle } from "@follow/components/ui/card/index.jsx"
import type { ModelPattern } from "@follow-app/client-sdk"
import { useTranslation } from "react-i18next"

import { formatTokenCount } from "../utils"
import { BarList } from "./charts"

interface EfficiencyTabProps {
  byModel: ModelPattern[]
}

export const EfficiencyTab = ({ byModel }: EfficiencyTabProps) => {
  const { t } = useTranslation("ai")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-text text-base">
          {t("analytics.efficiency_analysis", { defaultValue: "Efficiency analysis" })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {byModel?.length > 0 ? (
          <BarList
            data={byModel.map((m) => ({
              label: m.model ?? "unknown",
              value: m.avgEfficiency || 0,
              right: `${formatTokenCount(m.totalTokens ?? 0).value}${formatTokenCount(m.totalTokens ?? 0).unit}`,
            }))}
            format={(v) => `${formatTokenCount(v).value}${formatTokenCount(v).unit}`}
          />
        ) : (
          <div className="text-text-tertiary py-8 text-center text-sm">
            {t("analytics.no_data")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
