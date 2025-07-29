import { cn } from "@follow/utils/utils"
import * as PopoverPrimitive from "@radix-ui/react-popover"
import * as React from "react"

import { RootPortal } from "../portal"
import styles from "./index.module.css"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverClose = PopoverPrimitive.Close

const PopoverArrow = PopoverPrimitive.Arrow

const PopoverContent = ({
  ref,
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof PopoverPrimitive.Content> | null>
}) => (
  <RootPortal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        styles.popover,
        styles["popover__padding--base"],
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </RootPortal>
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverArrow, PopoverClose, PopoverContent, PopoverTrigger }
