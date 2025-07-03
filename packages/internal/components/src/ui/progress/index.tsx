"use client"

import { cn } from "@follow/utils/utils"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import * as React from "react"

const Progress = ({
  ref,
  className,
  value,
  ...props
}: React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
  ref?: React.RefObject<React.ElementRef<typeof ProgressPrimitive.Root> | null>
}) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("bg-accent/20 relative h-2 w-full overflow-hidden rounded-full", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="bg-accent size-full flex-1 transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
