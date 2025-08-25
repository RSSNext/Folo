import { DateTimePicker, TimeSelect } from "@follow/components/ui/input/index.js"
import { Label } from "@follow/components/ui/label/index.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@follow/components/ui/select/index.js"
import { cn } from "@follow/utils/utils"
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
  {
    value: "once",
    label: "Once",
    icon: "i-mgc-time-cute-re",
    description: "Run one time only",
  },
  {
    value: "daily",
    label: "Daily",
    icon: "i-mgc-round-cute-re",
    description: "Run every day",
  },
  {
    value: "weekly",
    label: "Weekly",
    icon: "i-mgc-layout-4-cute-re",
    description: "Run once per week",
  },
  {
    value: "monthly",
    label: "Monthly",
    icon: "i-mgc-grid-cute-re",
    description: "Run once per month",
  },
]

// Quick preset options for common schedules
const getQuickPresets = () => {
  const now = dayjs()
  return [
    {
      label: "Tomorrow 9AM",
      value: {
        type: "once" as const,
        date: now.add(1, "day").hour(9).minute(0).second(0).millisecond(0).toISOString(),
      },
    },
    {
      label: "Daily 6PM",
      value: {
        type: "daily" as const,
        timeOfDay: now.hour(18).minute(0).second(0).millisecond(0).toISOString(),
      },
    },
    {
      label: "Mon 9AM",
      value: {
        type: "weekly" as const,
        dayOfWeek: 1,
        timeOfDay: now.hour(9).minute(0).second(0).millisecond(0).toISOString(),
      },
    },
    {
      label: "1st 9AM",
      value: {
        type: "monthly" as const,
        dayOfMonth: 1,
        timeOfDay: now.hour(9).minute(0).second(0).millisecond(0).toISOString(),
      },
    },
  ]
}

const defaultErrors: Record<string, string> = {}

// Calculate next execution times for timeline preview
const getNextExecutions = (schedule: ScheduleType, count = 5): dayjs.Dayjs[] => {
  const now = dayjs()
  const executions: dayjs.Dayjs[] = []

  switch (schedule.type) {
    case "once": {
      const executeTime = dayjs(schedule.date)
      if (executeTime.isAfter(now)) {
        executions.push(executeTime)
      }
      break
    }
    case "daily": {
      const time = dayjs(schedule.timeOfDay)
      let nextExecution = now.hour(time.hour()).minute(time.minute()).second(0).millisecond(0)

      if (nextExecution.isBefore(now)) {
        nextExecution = nextExecution.add(1, "day")
      }

      for (let i = 0; i < count; i++) {
        executions.push(nextExecution.add(i, "day"))
      }
      break
    }
    case "weekly": {
      const time = dayjs(schedule.timeOfDay)
      let nextExecution = now
        .day(schedule.dayOfWeek)
        .hour(time.hour())
        .minute(time.minute())
        .second(0)
        .millisecond(0)

      if (nextExecution.isBefore(now) || nextExecution.day() !== schedule.dayOfWeek) {
        nextExecution = nextExecution.add(1, "week").day(schedule.dayOfWeek)
      }

      for (let i = 0; i < count; i++) {
        executions.push(nextExecution.add(i, "week"))
      }
      break
    }
    case "monthly": {
      const time = dayjs(schedule.timeOfDay)
      let nextExecution = now
        .date(schedule.dayOfMonth)
        .hour(time.hour())
        .minute(time.minute())
        .second(0)
        .millisecond(0)

      if (nextExecution.isBefore(now)) {
        nextExecution = nextExecution.add(1, "month")
      }

      for (let i = 0; i < count; i++) {
        executions.push(nextExecution.add(i, "month"))
      }
      break
    }
  }

  return executions
}

// Compact Timeline Preview Component
const TimelinePreview = memo<{ schedule: ScheduleType }>(({ schedule }) => {
  const executions = useMemo(() => getNextExecutions(schedule, 1), [schedule])
  const nextExecution = executions[0]

  if (!nextExecution) {
    return (
      <div className="text-text-tertiary flex items-center gap-2 text-xs">
        <div className="i-mgc-information-cute-re size-3" />
        <span>No upcoming executions</span>
      </div>
    )
  }

  return (
    <div className="text-text-secondary flex items-center gap-2 text-xs">
      <div className="i-mgc-time-cute-re text-accent size-3" />
      <span>
        Next: {nextExecution.format("MMM D, h:mm A")} ({nextExecution.fromNow()})
      </span>
    </div>
  )
})

TimelinePreview.displayName = "TimelinePreview"

export const ScheduleConfig = memo<ScheduleConfigProps>(
  ({ value, onChange, errors = defaultErrors }) => {
    const now = useMemo(() => dayjs(), [])
    const quickPresets = useMemo(() => getQuickPresets(), [])

    const scheduleType = value.type

    const updateSchedule = (newValue: ScheduleType) => {
      onChange(newValue)
    }

    return (
      <div className="space-y-4">
        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-text pl-2 text-sm font-medium">Quick Presets</Label>
          <div className="flex gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.value)}
                className="bg-material-opaque hover:bg-fill-tertiary border-border/50 hover:border-border text-text-secondary hover:text-text flex-1 rounded-md border px-2 py-1.5 text-xs transition-all duration-200"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-text pl-2 text-sm font-medium">Schedule</Label>
            <TimelinePreview schedule={value} />
          </div>
          <div className="grid grid-cols-4 gap-2">
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
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all duration-200",
                  scheduleType === option.value
                    ? "bg-accent/20 border-accent/30 text-accent"
                    : "bg-background border-border hover:bg-material-opaque hover:border-border text-text-secondary hover:text-text",
                )}
              >
                <div
                  className={cn(
                    "size-4",
                    option.icon,
                    scheduleType === option.value ? "text-accent" : "text-text-tertiary",
                  )}
                />
                <span className="font-medium">{option.label}</span>
              </button>
            ))}
          </div>
          {errors.type && <p className="text-red mt-2 text-sm">{errors.type}</p>}
        </div>

        {/* Time Configuration */}
        {scheduleType === "once" && (
          <div className="space-y-2">
            <Label className="text-text pl-2 text-sm font-medium">Date & Time</Label>
            <DateTimePicker
              value={value.date}
              minDate={now.toISOString()}
              onChange={(date) => {
                updateSchedule({
                  type: "once",
                  date,
                })
              }}
              placeholder="Select date & time"
            />
            {errors.date && <p className="text-red mt-2 text-sm">{errors.date}</p>}
          </div>
        )}

        {scheduleType === "daily" && (
          <div className="space-y-2 pl-2">
            <Label className="text-text text-sm font-medium">Time</Label>
            <TimeSelect
              value={dayjs(value.timeOfDay).format("HH:mm")}
              onChange={(time) => {
                const [hours, minutes] = time.split(":")
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
            {errors.timeOfDay && <p className="text-red mt-2 text-sm">{errors.timeOfDay}</p>}
          </div>
        )}

        {scheduleType === "weekly" && (
          <div className="space-y-2 pl-2">
            <Label className="text-text text-sm font-medium">Configuration</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-text-secondary text-xs">Day</Label>
                <Select
                  onValueChange={(dayOfWeek) =>
                    updateSchedule({
                      type: "weekly",
                      timeOfDay: value.timeOfDay,
                      dayOfWeek: Number(dayOfWeek),
                    })
                  }
                  value={value.dayOfWeek.toString()}
                >
                  <SelectTrigger className="bg-material-opaque hover:bg-mix-accent/background-1/4 h-6 justify-between rounded-[4px] border-0 px-1.5 py-0 text-xs">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {dayOfWeekOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dayOfWeek && <p className="text-red text-sm">{errors.dayOfWeek}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-text-secondary text-xs">Time</Label>
                <TimeSelect
                  value={dayjs(value.timeOfDay).format("HH:mm")}
                  onChange={(time) => {
                    const [hours, minutes] = time.split(":")
                    const currentDate = dayjs()
                    const timeOfDay = currentDate
                      .hour(Number(hours))
                      .minute(Number(minutes))
                      .second(0)
                      .millisecond(0)
                      .toISOString()
                    updateSchedule({
                      type: "weekly",
                      dayOfWeek: value.dayOfWeek,
                      timeOfDay,
                    })
                  }}
                />
                {errors.timeOfDay && <p className="text-red text-sm">{errors.timeOfDay}</p>}
              </div>
            </div>
          </div>
        )}

        {scheduleType === "monthly" && (
          <div className="space-y-2 pl-2">
            <Label className="text-text text-sm font-medium">Configuration</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-text-secondary text-xs">Day</Label>
                <Select
                  onValueChange={(dayOfMonth) =>
                    updateSchedule({
                      type: "monthly",
                      timeOfDay: value.timeOfDay,
                      dayOfMonth: Number(dayOfMonth),
                    })
                  }
                  value={value.dayOfMonth.toString()}
                >
                  <SelectTrigger className="bg-material-opaque hover:bg-mix-accent/background-1/4 h-6 justify-between rounded-[4px] border-0 px-1.5 py-0 text-xs">
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {dayOfMonthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dayOfMonth && <p className="text-red text-sm">{errors.dayOfMonth}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-text-secondary text-xs">Time</Label>
                <TimeSelect
                  value={dayjs(value.timeOfDay).format("HH:mm")}
                  onChange={(time) => {
                    const [hours, minutes] = time.split(":")
                    const currentDate = dayjs()
                    const timeOfDay = currentDate
                      .hour(Number(hours))
                      .minute(Number(minutes))
                      .second(0)
                      .millisecond(0)
                      .toISOString()
                    updateSchedule({
                      type: "monthly",
                      dayOfMonth: value.dayOfMonth,
                      timeOfDay,
                    })
                  }}
                />
                {errors.timeOfDay && <p className="text-red text-sm">{errors.timeOfDay}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

ScheduleConfig.displayName = "ScheduleConfig"
