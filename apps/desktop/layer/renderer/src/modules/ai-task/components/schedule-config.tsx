import { Input } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.js"
import dayjs from "dayjs"
import { memo, useMemo } from "react"

import type { ScheduleType } from "~/modules/ai-task/types"

interface ScheduleConfigProps {
  value: ScheduleType
  onChange: (value: ScheduleType) => void
  errors?: Record<string, string>
}

const dayOfWeekOptions = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
]

const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({
  value: (i + 1).toString(),
  label: (i + 1).toString(),
}))

const frequencyOptions = [
  { value: "once", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

const defaultErrors: Record<string, string> = {}

export const ScheduleConfig = memo<ScheduleConfigProps>(
  ({ value, onChange, errors = defaultErrors }) => {
    const now = useMemo(() => dayjs(), [])

    const scheduleType = value?.type || "once"

    const updateSchedule = (newValue: ScheduleType) => {
      onChange(newValue)
    }

    return (
      <div className="space-y-4">
        {/* First Row: Frequency Selection */}
        <div>
          <Label className="text-sm font-medium">Frequency</Label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {frequencyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  const defaultDate = value.type === "once" ? value.date : value.timeOfDay
                  const defaultSchedules: Record<string, ScheduleType> = {
                    once: { type: "once", date: defaultDate },
                    daily: {
                      type: "daily",
                      timeOfDay: defaultDate,
                    },
                    weekly: {
                      type: "weekly",
                      dayOfWeek: 1,
                      timeOfDay: defaultDate,
                    },
                    monthly: {
                      type: "monthly",
                      dayOfMonth: 1,
                      timeOfDay: defaultDate,
                    },
                  }
                  const defaultSchedule = defaultSchedules[option.value]
                  if (defaultSchedule) {
                    onChange(defaultSchedule)
                  }
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  scheduleType === option.value
                    ? "bg-accent text-white shadow-sm"
                    : "bg-background border-border hover:bg-accent/50 border"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
        </div>

        {/* Second Row: Time Settings */}
        <div>
          <Label className="text-sm font-medium">
            {scheduleType === "once" ? "Date & Time" : "Time Settings"}
          </Label>

          {scheduleType === "once" && (
            <div className="mt-2">
              <Input
                type="datetime-local"
                min={now.format("YYYY-MM-DDTHH:mm")}
                value={
                  value && value.type === "once" && value.date
                    ? dayjs(value.date).format("YYYY-MM-DDTHH:mm")
                    : ""
                }
                onChange={(e) => {
                  updateSchedule({
                    type: "once",
                    date: new Date(e.target.value).toISOString(),
                  })
                }}
              />
              {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
            </div>
          )}

          {scheduleType === "daily" && (
            <div className="mt-2">
              <Input
                type="time"
                value={
                  value && value.type === "daily" && value.timeOfDay
                    ? dayjs(value.timeOfDay).format("HH:mm")
                    : "12:00"
                }
                onChange={(e) => {
                  const [hours, minutes] = e.target.value.split(":")
                  const currentDate = dayjs()
                  const timeOfDay = currentDate
                    .hour(Number(hours))
                    .minute(Number(minutes))
                    .second(0)
                    .millisecond(0)
                    .toISOString()
                  updateSchedule({
                    type: "daily",
                    timeOfDay,
                  })
                }}
              />
              {errors.timeOfDay && <p className="mt-1 text-sm text-red-600">{errors.timeOfDay}</p>}
            </div>
          )}

          {scheduleType === "weekly" && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <Select
                  onValueChange={(dayOfWeek) =>
                    updateSchedule({
                      type: "weekly",
                      timeOfDay:
                        value.type === "weekly" ? value.timeOfDay : new Date().toISOString(),
                      dayOfWeek: Number(dayOfWeek),
                    })
                  }
                  value={
                    value && value.type === "weekly" && value.dayOfWeek !== undefined
                      ? value.dayOfWeek.toString()
                      : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOfWeekOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dayOfWeek && (
                  <p className="mt-1 text-sm text-red-600">{errors.dayOfWeek}</p>
                )}
              </div>
              <div>
                <Input
                  type="time"
                  value={
                    value && value.type === "weekly" && value.timeOfDay
                      ? dayjs(value.timeOfDay).format("HH:mm")
                      : "12:00"
                  }
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":")
                    const currentDate = dayjs()
                    const timeOfDay = currentDate
                      .hour(Number(hours))
                      .minute(Number(minutes))
                      .second(0)
                      .millisecond(0)
                      .toISOString()
                    updateSchedule({
                      type: "weekly",
                      dayOfWeek: value.type === "weekly" ? value.dayOfWeek : 0,
                      timeOfDay,
                    })
                  }}
                />
                {errors.timeOfDay && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeOfDay}</p>
                )}
              </div>
            </div>
          )}

          {scheduleType === "monthly" && (
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <Select
                  onValueChange={(dayOfMonth) =>
                    updateSchedule({
                      type: "monthly",
                      timeOfDay:
                        value.type === "monthly" ? value.timeOfDay : new Date().toISOString(),
                      dayOfMonth: Number(dayOfMonth),
                    })
                  }
                  value={
                    value && value.type === "monthly" && value.dayOfMonth !== undefined
                      ? value.dayOfMonth.toString()
                      : undefined
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {dayOfMonthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dayOfMonth && (
                  <p className="mt-1 text-sm text-red-600">{errors.dayOfMonth}</p>
                )}
              </div>
              <div>
                <Input
                  type="time"
                  value={
                    value && value.type === "monthly" && value.timeOfDay
                      ? dayjs(value.timeOfDay).format("HH:mm")
                      : "12:00"
                  }
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(":")
                    const currentDate = dayjs()
                    const timeOfDay = currentDate
                      .hour(Number(hours))
                      .minute(Number(minutes))
                      .second(0)
                      .millisecond(0)
                      .toISOString()
                    updateSchedule({
                      type: "monthly",
                      dayOfMonth: value.type === "monthly" ? value.dayOfMonth : 1,
                      timeOfDay,
                    })
                  }}
                />
                {errors.timeOfDay && (
                  <p className="mt-1 text-sm text-red-600">{errors.timeOfDay}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  },
)

ScheduleConfig.displayName = "ScheduleConfig"
