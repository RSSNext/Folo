import { useControlled } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import { useMemo, useState } from "react"

import { useMobile } from "../../hooks/useMobile"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./index"

export type ResponsiveSelectItem = {
  label: string
  value: string
}
export interface ResponsiveSelectProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  items: ResponsiveSelectItem[]
  renderValue?: (item: ResponsiveSelectItem) => React.ReactNode
  renderItem?: (item: ResponsiveSelectItem) => React.ReactNode
  size?: "sm" | "default"

  disabled?: boolean
  triggerClassName?: string
  contentClassName?: string
}
export const ResponsiveSelect = ({
  defaultValue,
  value,
  onValueChange,
  items,
  renderValue,
  renderItem,
  disabled,
  size = "default",
  triggerClassName,
  contentClassName,
  placeholder,
}: ResponsiveSelectProps) => {
  const [valueInner] = useControlled(value, defaultValue ?? "", onValueChange)

  const isMobile = useMobile()

  const valueToLabelMap = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          acc[item.value] = item.label
          return acc
        },
        {} as Record<string, string>,
      ),
    [items],
  )

  const [realSelectRef, setRealSelectRef] = useState<HTMLSelectElement | null>(null)
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={() => realSelectRef?.click()}
        className={cn(
          "placeholder:text-text-secondary flex w-full items-center justify-between whitespace-nowrap rounded-md bg-transparent disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          "ring-accent/20 focus:border-accent/80 duration-200 focus:outline-none focus:ring-2",
          "border-border border",
          size === "sm" ? "h-7 p-2 text-sm" : "h-9 px-3 py-2 text-sm",
          "hover:border-accent/80",
          "relative",
          triggerClassName,
        )}
      >
        <span className="flex">
          {(renderValue?.(items.find((item) => item.value === valueInner)!) ??
            valueToLabelMap[valueInner]) || (
            <span className="text-text-tertiary">{placeholder}</span>
          )}
        </span>
        <i className="i-mingcute-down-line ml-2 size-4 shrink-0 opacity-50" />
        <select
          ref={setRealSelectRef}
          className="absolute inset-0 opacity-0"
          value={valueInner}
          onChange={(e) => onValueChange?.(e.target.value)}
        >
          {items.map((item) => (
            <option key={item.value} value={item.value}>
              {renderItem?.(item) ?? item.label}
            </option>
          ))}
        </select>
      </button>
    )
  }

  return (
    <Select
      disabled={disabled}
      defaultValue={defaultValue}
      value={valueInner}
      onValueChange={onValueChange}
    >
      <SelectTrigger size={size} className={triggerClassName}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={contentClassName} position="item-aligned">
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {renderItem?.(item) ?? item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
