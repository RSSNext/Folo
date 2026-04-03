import { useInputComposition } from "@follow/hooks"
import { cn, stopPropagation } from "@follow/utils"
import type { DetailedHTMLProps, InputHTMLAttributes, ReactNode } from "react"
import { useState } from "react"
import * as React from "react"

export const InputV2 = ({
  ref,
  className,
  icon,
  canClear,
  ...props
}: Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "ref"> & {
  icon?: ReactNode
  canClear?: boolean
} & { ref?: React.RefObject<HTMLInputElement | null> }) => {
  const [internalValue, setInternalValue] = useState(props.value || props.defaultValue || "")

  const inputProps = useInputComposition(props)

  const handleClear = () => {
    setInternalValue("")

    if (props.onChange) {
      const event = {
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>
      props.onChange(event)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value)
    if (props.onChange) {
      props.onChange(e)
    }
  }

  const showClearButton = canClear && internalValue

  return (
    <div className="group relative">
      {icon && (
        <div className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center justify-center text-text-tertiary">
          {icon}
        </div>
      )}
      <input
        onContextMenu={stopPropagation}
        ref={ref}
        className={cn(
          "min-w-0 flex-auto appearance-none rounded-lg text-sm",
          "bg-theme-background py-[calc(theme(spacing.2)-1px)]",
          "ring-accent/20 duration-200 focus:border-accent/80 focus:outline-none focus:ring-2",
          "focus:!bg-accent/5",
          "border border-border",
          "placeholder:text-text-tertiary dark:bg-zinc-700/[0.15] dark:text-zinc-200",
          "hover:border-accent/60",
          props.type === "password" && "font-mono placeholder:font-sans",
          "w-full",
          // Adjust padding based on icon and clear button
          icon ? "pl-9" : "pl-3",
          canClear ? "pr-10" : "pr-3",
          className,
        )}
        {...props}
        {...inputProps}
        value={props.value !== undefined ? props.value : internalValue}
        onChange={handleChange}
      />
      {showClearButton && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 items-center text-text-tertiary transition-colors hover:text-text-secondary group-focus-within:flex"
          tabIndex={-1}
        >
          <i className="i-mingcute-close-circle-fill" />
        </button>
      )}
    </div>
  )
}
