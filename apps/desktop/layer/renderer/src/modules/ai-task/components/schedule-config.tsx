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
import type { GlobalError } from "react-hook-form"
import { useTranslation } from "react-i18next"

import type { ScheduleType } from "~/modules/ai-task/types"

interface ScheduleConfigProps {
  value: ScheduleType
  onChange: (value: ScheduleType) => void
  errors?: Record<string, GlobalError>
}

const dayOfWeekOptions = [
  { value: "0", label: "schedule.days.sunday" },
  { value: "1", label: "schedule.days.monday" },
  { value: "2", label: "schedule.days.tuesday" },
  { value: "3", label: "schedule.days.wednesday" },
  { value: "4", label: "schedule.days.thursday" },
  { value: "5", label: "schedule.days.friday" },
  { value: "6", label: "schedule.days.saturday" },
] as const

const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => ({
  value: (i + 1).toString(),
  label: (i + 1).toString(),
}))

const frequencyOptions = [
  {
    value: "once",
    label: "schedule.frequency.once",
    icon: "i-mgc-time-cute-re",
  },
  {
    value: "daily",
    label: "schedule.frequency.daily",
    icon: "i-mgc-round-cute-re",
  },
  {
    value: "weekly",
    label: "schedule.frequency.weekly",
    icon: "i-mgc-layout-4-cute-re",
  },
  {
    value: "monthly",
    label: "schedule.frequency.monthly",
    icon: "i-mgc-grid-cute-re",
  },
] as const

// Quick preset options for common schedules
const getQuickPresets = () => {
  const now = dayjs()
  return [
    {
      label: "schedule.presets.tomorrow_9am" as const,
      value: {
        type: "once" as const,
        date: now.add(1, "day").hour(9).minute(0).second(0).millisecond(0).toISOString(),
      },
    },
    {
      label: "schedule.presets.daily_6pm" as const,
      value: {
        type: "daily" as const,
        timeOfDay: now.hour(18).minute(0).second(0).millisecond(0).toISOString(),
      },
    },
    {
      label: "schedule.presets.monday_9am" as const,
      value: {
        type: "weekly" as const,
        dayOfWeek: 1,
        timeOfDay: now.hour(9).minute(0).second(0).millisecond(0).toISOString(),
      },
    },
    {
      label: "schedule.presets.first_9am" as const,
      value: {
        type: "monthly" as const,
        dayOfMonth: 1,
        timeOfDay: now.hour(9).minute(0).second(0).millisecond(0).toISOString(),
      },
    },
  ]
}

const defaultErrors: NonNullable<ScheduleConfigProps["errors"]> = {}

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
  const { t } = useTranslation("ai")
  const executions = useMemo(() => getNextExecutions(schedule, 1), [schedule])
  const nextExecution = executions[0]

  if (!nextExecution) {
    return (
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <div className="i-mgc-information-cute-re size-3" />
        <span>{t("schedule.no_upcoming")}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-text-secondary">
      <div className="i-mgc-time-cute-re size-3 text-accent" />
      <span>
        {t("schedule.next_execution", {
          time: nextExecution.format("MMM D, h:mm A"),
          relative: nextExecution.fromNow(),
        })}
      </span>
    </div>
  )
})

TimelinePreview.displayName = "TimelinePreview"

export const ScheduleConfig = memo<ScheduleConfigProps>(
  ({ value, onChange, errors = defaultErrors }) => {
    const { t } = useTranslation("ai")
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
          <Label className="pl-2 text-sm font-medium text-text">
            {t("schedule.presets_title")}
          </Label>
          <div className="flex gap-2">
            {quickPresets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange(preset.value)}
                className="flex-1 rounded-md border border-border/50 bg-material-opaque px-2 py-1.5 text-xs text-text-secondary transition-all duration-200 hover:border-border hover:bg-fill-tertiary hover:text-text"
              >
                {t(preset.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Frequency Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="pl-2 text-sm font-medium text-text">{t("schedule.title")}</Label>
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
                    ? "border-accent/30 bg-accent/20 text-accent"
                    : "border-border bg-background text-text-secondary hover:border-border hover:bg-material-opaque hover:text-text",
                )}
              >
                <div
                  className={cn(
                    "size-4",
                    option.icon,
                    scheduleType === option.value ? "text-accent" : "text-text-tertiary",
                  )}
                />
                <span className="font-medium">{t(option.label)}</span>
              </button>
            ))}
          </div>
          {errors.type && <p className="mt-2 text-sm text-red">{errors.type.message}</p>}
        </div>

        {/* Time Configuration */}
        {scheduleType === "once" && (
          <div className="space-y-2">
            <Label className="pl-2 text-sm font-medium text-text">
              {t("schedule.date_time_label")}
            </Label>
            <DateTimePicker
              value={value.date}
              minDate={now.toISOString()}
              onChange={(date) => {
                updateSchedule({
                  type: "once",
                  date,
                })
              }}
              placeholder={t("schedule.date_time_placeholder")}
            />
            {errors.date && <p className="mt-2 text-sm text-red">{errors.date.message}</p>}
          </div>
        )}

        {scheduleType === "daily" && (
          <div className="space-y-2 pl-2">
            <Label className="text-sm font-medium text-text">{t("schedule.time_label")}</Label>
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
            {errors.timeOfDay && (
              <p className="mt-2 text-sm text-red">{errors.timeOfDay.message}</p>
            )}
          </div>
        )}

        {scheduleType === "weekly" && (
          <div className="space-y-2 pl-2">
            <Label className="text-sm font-medium text-text">
              {t("schedule.configuration_label")}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-text-secondary">{t("schedule.day_label")}</Label>
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
                  <SelectTrigger className="h-6 justify-between rounded-[4px] border-0 bg-material-opaque px-1.5 py-0 text-xs hover:bg-mix-accent/background-1/4">
                    <SelectValue placeholder={t("schedule.day_placeholder")} />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {dayOfWeekOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {t(option.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dayOfWeek && <p className="text-sm text-red">{errors.dayOfWeek.message}</p>}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-text-secondary">{t("schedule.time_label")}</Label>
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
                {errors.timeOfDay && <p className="text-sm text-red">{errors.timeOfDay.message}</p>}
              </div>
            </div>
          </div>
        )}

        {scheduleType === "monthly" && (
          <div className="space-y-2 pl-2">
            <Label className="text-sm font-medium text-text">
              {t("schedule.configuration_label")}
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-text-secondary">{t("schedule.day_label")}</Label>
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
                  <SelectTrigger className="h-6 justify-between rounded-[4px] border-0 bg-material-opaque px-1.5 py-0 text-xs hover:bg-mix-accent/background-1/4">
                    <SelectValue placeholder={t("schedule.day_placeholder")} />
                  </SelectTrigger>
                  <SelectContent position="item-aligned">
                    {dayOfMonthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.dayOfMonth && (
                  <p className="text-sm text-red">{errors.dayOfMonth.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-text-secondary">{t("schedule.time_label")}</Label>
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
                {errors.timeOfDay && <p className="text-sm text-red">{errors.timeOfDay.message}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  },
)

ScheduleConfig.displayName = "ScheduleConfig"
