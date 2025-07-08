import { cn } from "@follow/utils/utils"

import type { StatCardProps } from "./StatCard"
import { StatCard } from "./StatCard"

export interface StatisticsOverviewProps {
  stats: StatCardProps[]
  columns?: {
    base: number
    md: number
    lg?: number
  }
  className?: string
}

export const StatisticsOverview = ({
  stats,
  columns = { base: 2, md: 4 },
  className,
}: StatisticsOverviewProps) => (
  <div
    className={cn(
      "grid gap-4",
      `grid-cols-${columns.base}`,
      `md:grid-cols-${columns.md}`,
      columns.lg && `lg:grid-cols-${columns.lg}`,
      className,
    )}
  >
    {stats.map((stat, index) => (
      <StatCard key={index} {...stat} />
    ))}
  </div>
)
