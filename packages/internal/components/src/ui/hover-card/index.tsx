import { cn } from "@follow/utils/utils"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"
import * as React from "react"

import { RootPortal } from "../portal"

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = ({
  ref,
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof HoverCardPrimitive.Content> | null>
}) => (
  <RootPortal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "bg-material-medium backdrop-blur-background border-border text-text z-[60] w-fit overflow-hidden rounded-md border shadow-lg",
        "motion-scale-in-95 motion-duration-200 text-body",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className,
      )}
      {...props}
    />
  </RootPortal>
)
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

const HoverCardArrow = HoverCardPrimitive.Arrow

export { HoverCard, HoverCardArrow, HoverCardContent, HoverCardTrigger }
