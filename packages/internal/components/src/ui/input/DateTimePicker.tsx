import { clsx, cn } from "@follow/utils/utils"
import { useDatePicker } from "@rehookify/datepicker"
import dayjs from "dayjs"
import { memo, useEffect, useMemo, useState } from "react"
import * as React from "react"

import { Button } from "../button"
import { Popover, PopoverContent, PopoverTrigger } from "../popover"
import { TimeSelect } from "./TimeSelect"

export interface DateTimePickerProps {
  /** DateTime value as ISO string */
  value?: string
  /** Called with new datetime ISO string */
  onChange?: (value: string) => void
  /** Minimum date as ISO string */
  minDate?: string
  /** Placeholder text */
  placeholder?: string
  className?: string
  disabled?: boolean
  /** Picker mode. Default is single */
  mode?: "single" | "range"
  /** Range value when mode is range */
  rangeValue?: { start?: string; end?: string }
  /** Called with new range when mode is range */
  onRangeChange?: (value: { start?: string; end?: string }) => void
  /** Placeholder for range mode */
  rangePlaceholder?: string
  /** Class name for the content */
  contentClassName?: string
  /** Custom trigger element. If provided, replaces the default button */
  children?: React.ReactNode
}

/**
 * Custom datetime picker using @rehookify/datepicker for headless calendar logic
 * and custom time selection components.
 */
export const DateTimePicker = memo<DateTimePickerProps>(
  ({
    value,
    onChange,
    minDate,
    placeholder = "Select date & time",
    className,
    disabled,
    mode = "single",
    rangeValue,
    onRangeChange,
    rangePlaceholder = "Select date range",
    contentClassName,
    children,
  }) => {
    const [isOpen, setIsOpen] = useState(false)
    const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days")

    const currentDateTime = useMemo(() => {
      if (!value) return dayjs()
      return dayjs(value)
    }, [value])

    const isRangeMode = mode === "range"

    // Local state for range mode
    const [rangeStart, setRangeStart] = useState<dayjs.Dayjs | null>(() =>
      rangeValue?.start ? dayjs(rangeValue.start) : null,
    )
    const [rangeEnd, setRangeEnd] = useState<dayjs.Dayjs | null>(() =>
      rangeValue?.end ? dayjs(rangeValue.end) : null,
    )

    useEffect(() => {
      setRangeStart(rangeValue?.start ? dayjs(rangeValue.start) : null)
      setRangeEnd(rangeValue?.end ? dayjs(rangeValue.end) : null)
    }, [rangeValue?.start, rangeValue?.end])

    const minDateObj = useMemo(() => {
      return minDate ? dayjs(minDate) : dayjs()
    }, [minDate])

    const {
      data: { weekDays, calendars, months, years },
      propGetters: { dayButton, addOffset, subtractOffset, monthButton, yearButton },
    } = useDatePicker({
      selectedDates: isRangeMode
        ? ([rangeStart?.toDate(), rangeEnd?.toDate()].filter(Boolean) as Date[])
        : value
          ? [new Date(value)]
          : [],
      onDatesChange: (dates) => {
        if (isRangeMode) {
          // Ignore internal range selection; we handle it per-click
          return
        }
        if (dates.length > 0 && dates[0]) {
          const selectedDate = dayjs(dates[0])
          const newDateTime = selectedDate
            .hour(currentDateTime.hour())
            .minute(currentDateTime.minute())
            .second(0)
            .millisecond(0)

          // Ensure the new date is not before min date
          const finalDateTime = newDateTime.isBefore(minDateObj) ? minDateObj : newDateTime

          onChange?.(finalDateTime.toISOString())
          setIsOpen(false)
        }
      },
      dates: {
        minDate: minDate ? new Date(minDate) : new Date(),
      },
    })

    const calendar = calendars[0]
    if (!calendar) return null

    const handleTimeChange = (time: string) => {
      const [hours, minutes] = time.split(":")
      const newDateTime = currentDateTime
        .hour(Number(hours))
        .minute(Number(minutes))
        .second(0)
        .millisecond(0)

      onChange?.(newDateTime.toISOString())
    }

    const formatRangeButtonLabel = (): string => {
      if (!rangeStart && !rangeEnd) return rangePlaceholder
      if (rangeStart && !rangeEnd) return `${rangeStart.format("MMM DD, YYYY")} – ...`
      if (!rangeStart && rangeEnd) return `... – ${rangeEnd.format("MMM DD, YYYY")}`
      return `${rangeStart!.format("MMM DD, YYYY")} – ${rangeEnd!.format("MMM DD, YYYY")}`
    }

    const handleDayClickRange = (clickedDate: Date) => {
      const clicked = dayjs(clickedDate).startOf("day")
      if (clicked.isBefore(minDateObj)) {
        return
      }

      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(clicked)
        setRangeEnd(null)
        return
      }

      if (rangeStart && !rangeEnd) {
        if (clicked.isBefore(rangeStart)) {
          setRangeEnd(rangeStart)
          setRangeStart(clicked)
          onRangeChange?.({ start: clicked.toISOString(), end: rangeStart.toISOString() })
          setIsOpen(false)
          return
        }

        setRangeEnd(clicked)
        onRangeChange?.({ start: rangeStart.toISOString(), end: clicked.toISOString() })
        setIsOpen(false)
      }
    }

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {children || (
            <Button
              variant="outline"
              disabled={disabled}
              buttonClassName={cn(
                "w-full justify-start text-left font-normal px-2.5",
                isRangeMode
                  ? !rangeStart && !rangeEnd && "text-text-tertiary"
                  : !value && "text-text-tertiary",
                className,
              )}
            >
              <i className="i-mgc-calendar-time-add-cute-re mr-2 size-4" />
              {isRangeMode
                ? formatRangeButtonLabel()
                : value
                  ? currentDateTime.format("MMM DD, YYYY HH:mm")
                  : placeholder}
            </Button>
          )}
        </PopoverTrigger>

        <PopoverContent
          className={clsx("w-auto min-w-[280px] rounded-[6px] border p-0", contentClassName)}
          align="start"
        >
          <div className="p-2">
            {/* Calendar Header */}
            <div className="mb-2 flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                {...subtractOffset({ months: 1 })}
                buttonClassName="size-7 p-0 hover:bg-accent/10"
                disabled={viewMode !== "days"}
              >
                <i className="i-mingcute-left-line size-3.5" />
              </Button>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  buttonClassName="text-text text-sm font-medium hover:bg-mix-accent/background-1/4 px-2 py-1 rounded-[4px]"
                  onClick={() => setViewMode(viewMode === "months" ? "days" : "months")}
                >
                  {calendar.month}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  buttonClassName="text-text text-sm font-medium hover:bg-mix-accent/background-1/4 px-2 py-1 rounded-[4px]"
                  onClick={() => setViewMode(viewMode === "years" ? "days" : "years")}
                >
                  {calendar.year}
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                {...addOffset({ months: 1 })}
                buttonClassName="size-7 p-0 hover:bg-accent/10"
                disabled={viewMode !== "days"}
              >
                <i className="i-mingcute-right-line size-3.5" />
              </Button>
            </div>

            {/* Days View */}
            {viewMode === "days" && (
              <>
                {/* Weekdays */}
                <div className="text-text-secondary mb-1 grid grid-cols-7 gap-0.5 text-center text-xs">
                  {weekDays.map((day) => (
                    <div key={day} className="flex h-6 items-center justify-center font-medium">
                      {day.slice(0, 2)}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="mb-2 grid grid-cols-7 gap-0.5">
                  {calendar.days.map((day) => {
                    const dayProps = dayButton(day)
                    const isSelected = isRangeMode
                      ? !!(
                          (rangeStart && dayjs(day.$date).isSame(rangeStart, "day")) ||
                          (rangeEnd && dayjs(day.$date).isSame(rangeEnd, "day"))
                        )
                      : day.selected
                    const isToday = day.now
                    const isOtherMonth = !day.inCurrentMonth
                    const isDisabled = day.disabled

                    return (
                      <Button
                        key={day.$date.toISOString()}
                        variant="ghost"
                        size="sm"
                        {...dayProps}
                        onClick={(ev) => {
                          if (isRangeMode) {
                            ev.preventDefault()
                            ev.stopPropagation()
                            handleDayClickRange(day.$date)
                          } else {
                            dayProps.onClick?.(ev)
                          }
                        }}
                        buttonClassName={cn(
                          "size-7 p-0 font-normal text-xs rounded-[4px]",
                          isSelected && "bg-accent hover:bg-accent/90 text-white",
                          isToday && !isSelected && "bg-accent/10 font-medium",
                          isOtherMonth && "text-text-quaternary",
                          isDisabled && "text-text-quaternary cursor-not-allowed opacity-50",
                          !isSelected && !isDisabled && "hover:bg-mix-accent/background-1/4",
                        )}
                        disabled={isDisabled}
                      >
                        {day.day}
                      </Button>
                    )
                  })}
                </div>
              </>
            )}

            {/* Months View */}
            {viewMode === "months" && (
              <div className="mb-2 grid grid-cols-3 gap-1">
                {months.map((month) => {
                  const monthProps = monthButton(month)
                  const isSelected = month.selected
                  const isToday = month.now
                  const isDisabled = month.disabled

                  return (
                    <Button
                      key={month.$date.toISOString()}
                      variant="ghost"
                      size="sm"
                      {...monthProps}
                      onClick={(ev) => {
                        monthProps.onClick?.(ev)
                        setViewMode("days")
                      }}
                      buttonClassName={cn(
                        "h-8 p-2 font-normal text-xs rounded-[4px]",
                        isSelected && "bg-accent hover:bg-accent/90 text-white",
                        isToday && !isSelected && "bg-accent/10 font-medium",
                        isDisabled && "text-text-quaternary cursor-not-allowed opacity-50",
                        !isSelected && !isDisabled && "hover:bg-mix-accent/background-1/4",
                      )}
                      disabled={isDisabled}
                    >
                      {month.month}
                    </Button>
                  )
                })}
              </div>
            )}

            {/* Years View */}
            {viewMode === "years" && (
              <div className="mb-2 grid grid-cols-4 gap-1">
                {years.map((year) => {
                  const yearProps = yearButton(year)
                  const isSelected = year.selected
                  const isToday = year.now
                  const isDisabled = year.disabled

                  return (
                    <Button
                      key={year.$date.toISOString()}
                      variant="ghost"
                      size="sm"
                      {...yearProps}
                      onClick={(ev) => {
                        yearProps.onClick?.(ev)
                        setViewMode("days")
                      }}
                      buttonClassName={cn(
                        "h-8 p-2 font-normal text-xs rounded-[4px]",
                        isSelected && "bg-accent hover:bg-accent/90 text-white",
                        isToday && !isSelected && "bg-accent/10 font-medium",
                        isDisabled && "text-text-quaternary cursor-not-allowed opacity-50",
                        !isSelected && !isDisabled && "hover:bg-mix-accent/background-1/4",
                      )}
                      disabled={isDisabled}
                    >
                      {year.year}
                    </Button>
                  )
                })}
              </div>
            )}

            {/* Time Selection (only single mode) */}
            {!isRangeMode && (
              <div className="border-border -mx-2 border-t px-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary text-xs font-medium">Time</span>
                  <TimeSelect
                    value={currentDateTime.format("HH:mm")}
                    onChange={handleTimeChange}
                    className="gap-0.5"
                  />
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  },
)

DateTimePicker.displayName = "DateTimePicker"
