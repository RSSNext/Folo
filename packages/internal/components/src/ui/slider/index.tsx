import { cn } from "@follow/utils/utils"
import * as SliderPrimitive from "@radix-ui/react-slider"
import * as React from "react"

export const Slider = ({
  ref,
  className,
  variant = "primary",
  ...props
}: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
  variant?: "primary" | "secondary"
} & {
  ref?: React.Ref<
    | (React.ElementRef<typeof SliderPrimitive.Root> & {
        variant?: "primary" | "secondary"
      })
    | null
  >
}) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative h-1.5 w-full grow overflow-hidden rounded-full",
        variant === "primary" ? "bg-accent/20" : "bg-zinc-200 dark:bg-zinc-700",
      )}
    >
      <SliderPrimitive.Range
        className={cn(
          "absolute h-full",
          variant === "primary" ? "bg-accent" : "bg-zinc-400 dark:bg-zinc-500",
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "bg-background block size-4 rounded-full border shadow transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary"
          ? "border-accent/50 focus-visible:ring-accent"
          : "border-zinc-400 focus-visible:ring-zinc-400 dark:border-zinc-500 dark:focus-visible:ring-zinc-500",
      )}
    />
  </SliderPrimitive.Root>
)
Slider.displayName = SliderPrimitive.Root.displayName
