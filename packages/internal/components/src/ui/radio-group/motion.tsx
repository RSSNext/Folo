"use client"

import { cn } from "@follow/utils/utils"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import type { HTMLMotionProps, Transition } from "motion/react"
import { AnimatePresence, m } from "motion/react"
import * as React from "react"

import { Spring } from "../../constants/spring"

type RadioGroupProps = React.ComponentProps<typeof RadioGroupPrimitive.Root> & {
  transition?: Transition
}

function RadioGroup({ className, ...props }: RadioGroupProps) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2.5", className)}
      {...props}
    />
  )
}

type RadioGroupIndicatorProps = React.ComponentProps<typeof RadioGroupPrimitive.Indicator> & {
  transition: Transition
}

function RadioGroupIndicator({ className, transition, ...props }: RadioGroupIndicatorProps) {
  return (
    <RadioGroupPrimitive.Indicator
      data-slot="radio-group-indicator"
      asChild
      className={cn("absolute inset-0 flex items-center justify-center", className)}
      {...props}
    >
      <AnimatePresence>
        <m.div
          key="radio-group-indicator-circle"
          data-slot="radio-group-indicator-circle"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={transition}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-3 fill-current text-current"
          >
            <circle cx="12" cy="12" r="10" />
          </svg>
        </m.div>
      </AnimatePresence>
    </RadioGroupPrimitive.Indicator>
  )
}

type RadioGroupItemProps = React.ComponentProps<typeof RadioGroupPrimitive.Item> &
  HTMLMotionProps<"button"> & {
    transition?: Transition
    label?: string
  }

function RadioGroupItem({
  className,
  transition = Spring.presets.smooth,
  label,
  ...props
}: RadioGroupItemProps) {
  const id = React.useId()
  return (
    <RadioGroupPrimitive.Item asChild {...props}>
      <div className="flex items-center gap-2">
        <m.button
          type="button"
          data-slot="radio-group-item"
          className={cn(
            "border-border text-accent ring-material-opaque focus-visible:ring-border flex aspect-square size-5 items-center justify-center rounded-full border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          {...props}
        >
          <RadioGroupIndicator data-slot="radio-group-item-indicator" transition={transition} />
        </m.button>
        {label && <label htmlFor={id}>{label}</label>}
      </div>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem, type RadioGroupItemProps, type RadioGroupProps }
