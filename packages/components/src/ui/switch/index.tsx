import { cn } from "@follow/utils/utils"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import * as React from "react"

export const Switch = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root> & {
  ref: React.RefObject<React.ElementRef<typeof SwitchPrimitives.Root>>
}) => (
  <SwitchPrimitives.Root
    className={cn(
      "cursor-switch focus-visible:ring-accent focus-visible:ring-offset-background peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-accent data-[state=unchecked]:bg-theme-inactive dark:data-[state=unchecked]:bg-theme-accent-100/10 duration-200",
      "hover:data-[state=unchecked]:bg-theme-inactive/80 dark:hover:data-[state=unchecked]:bg-theme-accent-100/15",
      "hover:data-[state=checked]:bg-accent/80 dark:hover:data-[state=checked]:bg-accent",
      "group",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb className="bg-background pointer-events-none block size-4 rounded-full ring-0 transition-transform duration-200 data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 group-hover:dark:data-[state=checked]:!bg-black/80" />
  </SwitchPrimitives.Root>
)
Switch.displayName = SwitchPrimitives.Root.displayName
