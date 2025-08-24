import { cn } from "@follow/utils/utils"
import { memo, useMemo } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../select"

export interface TimeSelectProps {
  /** Time value in 24h format HH:mm */
  value?: string
  /** Called with new time string in HH:mm */
  onChange?: (value: string) => void
  /** Minute step granularity */
  minuteStep?: number
  className?: string
  disabled?: boolean
  /** Optional aria-label prefix (Hour / Minute will be appended) */
  label?: string
}

const FALLBACK_TIME = "12:00"
/**
 * Custom time picker built from our Select primitives.
 * Provides hour + minute dropdowns (24h clock) with configurable minute step (default 1).
 */
export const TimeSelect = memo<TimeSelectProps>(
  ({ value = FALLBACK_TIME, onChange, minuteStep = 1, className, disabled, label }) => {
    // Normalize incoming value
    const [hourValue, minuteValue] = useMemo(() => {
      if (!/^\d{2}:\d{2}$/.test(value)) {
        console.warn("Invalid TimeSelect value, expected HH:mm", value)
        return ["12", "00"]
      }
      const [h, m] = value.split(":")
      return [h!.padStart(2, "0"), m!.padStart(2, "0")]
    }, [value])

    const hours = useMemo(
      () =>
        Array.from({ length: 24 }, (_, i) => {
          const v = String(i).padStart(2, "0")
          return { label: v, value: v }
        }),
      [],
    )

    const minutes = useMemo(() => {
      const list: { label: string; value: string }[] = []
      for (let i = 0; i < 60; i += minuteStep) {
        const v = String(i).padStart(2, "0")
        list.push({ label: v, value: v })
      }
      return list
    }, [minuteStep])

    const update = (h: string, m: string) => {
      const hh = h.padStart(2, "0")
      const mm = m.padStart(2, "0")
      onChange?.(`${hh}:${mm}`)
    }

    return (
      <div
        className={cn(
          "flex items-center gap-1", // layout
          className,
        )}
      >
        <Select disabled={disabled} value={hourValue} onValueChange={(h) => update(h, minuteValue)}>
          <SelectTrigger
            aria-label={label ? `${label} hour` : "Hour"}
            className="w-16 justify-between px-2 py-1 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64 w-20 p-1">
            {hours.map((h) => (
              <SelectItem key={h.value} value={h.value} className="text-sm">
                {h.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-text-secondary select-none px-0.5">:</span>
        <Select disabled={disabled} value={minuteValue} onValueChange={(m) => update(hourValue, m)}>
          <SelectTrigger
            aria-label={label ? `${label} minute` : "Minute"}
            className="w-16 justify-between px-2 py-1 text-sm"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64 w-20 p-1">
            {minutes.map((m) => (
              <SelectItem key={m.value} value={m.value} className="text-sm">
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  },
)

TimeSelect.displayName = "TimeSelect"

export default TimeSelect
