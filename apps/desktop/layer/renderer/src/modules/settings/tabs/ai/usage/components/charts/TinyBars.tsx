import { cn } from "@follow/utils/utils"

import type { ChartDataPoint } from "../../types"

interface TinyBarsProps {
  data: ChartDataPoint[]
  max: number
  highlightThreshold?: (value: number) => boolean
}

export const TinyBars = ({ data, max, highlightThreshold }: TinyBarsProps) => {
  return (
    <div className="flex size-full items-end gap-[3px]">
      {data.map((d) => {
        const h = (d.value / Math.max(1, max)) * 100
        const highlight = highlightThreshold ? highlightThreshold(d.value) : false
        return (
          <div
            key={d.label}
            className={cn(
              "relative w-full rounded-sm bg-fill-secondary transition-colors hover:bg-accent/20",
              highlight && "bg-accent/40",
            )}
            style={{ height: `${Math.max(4, h)}%` }}
            title={`${d.label}: ${d.value}`}
          />
        )
      })}
    </div>
  )
}
