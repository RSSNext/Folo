import { cn } from "@follow/utils/utils"
import * as LabelPrimitive from "@radix-ui/react-label"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import * as React from "react"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
)

export const Label = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants> & {
    ref?: React.Ref<React.ElementRef<typeof LabelPrimitive.Root> | null>
  }) => <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
Label.displayName = LabelPrimitive.Root.displayName
