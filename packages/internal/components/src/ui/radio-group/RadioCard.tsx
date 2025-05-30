import { cn } from "@follow/utils/utils"
import type { FC, ReactNode } from "react"
import { useId } from "react"
import { useEventCallback } from "usehooks-ts"

import { useRadioContext, useRadioGroupValue } from "./context"

export const RadioCard: FC<
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
    label: ReactNode
    wrapperClassName?: string
  }
> = (props) => {
  const { id, label, className, wrapperClassName, value, onChange, ...rest } = props
  const { onChange: ctxOnChange } = useRadioContext() || {}
  const fallbackId = useId()

  const ctxValue = useRadioGroupValue()

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = useEventCallback((e) => {
    ctxOnChange?.(e.target.value)
    onChange?.(e)
  })

  const selected = value === ctxValue

  return (
    <label
      htmlFor={id ?? fallbackId}
      data-state={selected ? "selected" : "unselected"}
      className={cn(
        "flex cursor-pointer items-center rounded-md p-2",
        "border",

        "ring-accent/20 ring-0 duration-200",

        selected && "border-accent bg-accent/5 font-medium outline-none ring-2",
        wrapperClassName,
      )}
      tabIndex={1}
    >
      <input
        id={id ?? fallbackId}
        type="radio"
        className={cn("hidden size-0", className)}
        value={value}
        checked={ctxValue === value}
        onChange={handleChange}
        {...rest}
      />
      <span>{label}</span>
    </label>
  )
}
