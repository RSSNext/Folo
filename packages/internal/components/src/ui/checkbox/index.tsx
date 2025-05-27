"use client"

import { cn } from "@follow/utils/utils"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import type { HTMLMotionProps } from "motion/react"
import { m } from "motion/react"
import * as React from "react"

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & HTMLMotionProps<"button">

function Checkbox({ className, onCheckedChange, ...props }: CheckboxProps) {
  const [isChecked, setIsChecked] = React.useState(props?.checked ?? props?.defaultChecked ?? false)

  React.useEffect(() => {
    if (props?.checked !== undefined) setIsChecked(props.checked)
  }, [props?.checked])

  const handleCheckedChange = React.useCallback(
    (checked: boolean) => {
      setIsChecked(checked)
      onCheckedChange?.(checked)
    },
    [onCheckedChange],
  )

  return (
    <CheckboxPrimitive.Root {...props} onCheckedChange={handleCheckedChange} asChild>
      <m.button
        data-slot="checkbox"
        className={cn(
          "bg-fill cursor-checkbox focus-visible:ring-border data-[state=checked]:bg-accent peer flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:text-white",
          className,
        )}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        {...props}
      >
        <CheckboxPrimitive.Indicator forceMount asChild>
          <m.svg
            data-slot="checkbox-indicator"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="3.5"
            stroke="currentColor"
            className="size-3.5"
            initial="unchecked"
            animate={isChecked ? "checked" : "unchecked"}
          >
            <m.path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
              variants={{
                checked: {
                  pathLength: 1,
                  opacity: 1,
                  transition: {
                    duration: 0.2,
                  },
                },
                unchecked: {
                  pathLength: 0,
                  opacity: 0,
                  transition: {
                    duration: 0.2,
                  },
                },
              }}
            />
          </m.svg>
        </CheckboxPrimitive.Indicator>
      </m.button>
    </CheckboxPrimitive.Root>
  )
}

Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox, type CheckboxProps }
