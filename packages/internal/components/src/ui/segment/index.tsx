import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import type { ReactNode } from "react"
import { useId, useMemo, useState } from "react"
import { useContextSelector } from "use-context-selector"

import { Spring } from "../../constants/spring"
import { SegmentGroupContext } from "./ctx"

interface SegmentGroupProps {
  value?: string
  onValueChanged?: (value: string) => void
}
export const SegmentGroup = (props: ComponentType<SegmentGroupProps>) => {
  const { onValueChanged, value, className } = props

  const isControlled = value !== undefined
  const [uncontrolledValue, setUncontrolledValue] = useState(value || "")
  const currentValue = isControlled ? value : uncontrolledValue
  const componentId = useId()

  return (
    <SegmentGroupContext.Provider
      value={useMemo(
        () => ({
          value: currentValue,
          setValue: (nextValue) => {
            if (!isControlled) {
              setUncontrolledValue(nextValue)
            }
            onValueChanged?.(nextValue)
          },
          componentId,
        }),
        [componentId, currentValue, isControlled, onValueChanged],
      )}
    >
      {/* The group takes the focus and moves the selection with the arrow keys, pointing assistive
          technology at the selected segment */}
      <div
        role="tablist"
        className={cn(
          "inline-flex h-9 items-center justify-center rounded-lg bg-fill-tertiary p-1 text-text-secondary outline-none",
          "focus-visible:ring-2 focus-visible:ring-accent/30",
          className,
        )}
        tabIndex={0}
        aria-activedescendant={getSegmentItemId(componentId, currentValue)}
        data-orientation="horizontal"
        onKeyDown={selectSegmentWithKeyboard}
      >
        {props.children}
      </div>
    </SegmentGroupContext.Provider>
  )
}

const getSegmentItemId = (componentId: string, value: string) =>
  `${componentId}-segment-${value.replaceAll(/\s/g, "-")}`

const selectSegmentWithKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
  )
  if (items.length === 0) return
  event.preventDefault()

  const current = items.findIndex((item) => item.dataset.state === "active")
  const last = items.length - 1
  const next =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? last
        : event.key === "ArrowLeft"
          ? current <= 0
            ? last
            : current - 1
          : current === -1 || current === last
            ? 0
            : current + 1
  items[next]!.click()
}

export const SegmentItem: Component<{
  value: string
  label: ReactNode
}> = ({ label, value, className }) => {
  const isActive = useContextSelector(SegmentGroupContext, (v) => v.value === value)
  const setValue = useContextSelector(SegmentGroupContext, (v) => v.setValue)
  const layoutId = useContextSelector(SegmentGroupContext, (v) => v.componentId)
  return (
    <button
      type="button"
      role="tab"
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap px-3 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-text",
        "h-full rounded-md focus-visible:ring-accent/30",
        className,
      )}
      id={getSegmentItemId(layoutId, value)}
      tabIndex={-1}
      aria-selected={isActive}
      data-orientation="horizontal"
      onClick={() => {
        setValue(value)
      }}
      data-state={isActive ? "active" : "inactive"}
    >
      <span className="z-[1]">{label}</span>

      {isActive && (
        <m.span
          layout
          transition={Spring.presets.smooth}
          layoutId={layoutId}
          className="absolute inset-0 z-0 rounded-md bg-background shadow"
        />
      )}
    </button>
  )
}
