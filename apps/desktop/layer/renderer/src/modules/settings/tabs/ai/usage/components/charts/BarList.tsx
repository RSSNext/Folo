import type { BarListItem } from "../../types"

interface BarListProps {
  data: BarListItem[]
  suffix?: string
  format?: (v: number) => string
}

export const BarList = ({ data, suffix, format }: BarListProps) => {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = (d.value / max) * 100
        const left = format ? format(d.value) : `${Math.round(d.value)}${suffix ?? ""}`
        return (
          <div key={d.label} className="space-y-1">
            <div className="text-text flex items-center justify-between text-sm">
              <span className="truncate" title={d.label}>
                {d.label}
              </span>
              <span className="text-text-tertiary text-xs">{d.right ?? left}</span>
            </div>
            <div className="bg-fill-secondary relative h-2.5 overflow-hidden rounded">
              <div
                className="bg-accent/70 absolute inset-y-0 left-0 rounded"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
