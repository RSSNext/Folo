import { cn } from "@follow/utils/utils"

export interface AnalyticsMetric {
  label: string
  value: string | number
}

export interface AnalyticsMetricsProps {
  metrics: AnalyticsMetric[]
  className?: string
}

export const AnalyticsMetrics = ({ metrics, className }: AnalyticsMetricsProps) => (
  <ul className={cn("space-y-1 text-xs", className)}>
    {metrics.map((metric, index) => (
      <li key={index} className="flex items-center justify-between">
        <span className="text-text-tertiary">{metric.label}</span>
        <span className="text-text font-medium">{metric.value}</span>
      </li>
    ))}
  </ul>
)
