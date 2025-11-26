import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils/utils"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { m } from "motion/react"
import * as React from "react"

import { tooltipStyle, tooltipStyles } from "./styles"

const TooltipProvider = TooltipPrimitive.Provider
const TooltipRoot = TooltipPrimitive.Root

const Tooltip: typeof TooltipProvider = ({ children, ...props }) => (
  <TooltipProvider delayDuration={200} skipDelayDuration={1000} {...props}>
    <TooltipPrimitive.Tooltip>{children}</TooltipPrimitive.Tooltip>
  </TooltipProvider>
)

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = ({
  ref,
  className,
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof TooltipPrimitive.Content> | null>
}) => (
  <TooltipPrimitive.Content
    ref={ref}
    asChild
    sideOffset={sideOffset}
    className={cn(tooltipStyle.content, className)}
    {...props}
  >
    <m.div
      initial={{ opacity: 0.82, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={Spring.snappy(0.1)}
      style={tooltipStyles.container}
    >
      {/* Inner glow layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-lg"
        style={tooltipStyles.innerGlow}
      />
      {/* https://github.com/radix-ui/primitives/discussions/868 */}
      <TooltipPrimitive.Arrow
        className="z-50 [clip-path:inset(0_-10px_-10px_-10px)]"
        style={tooltipStyles.arrow}
      />
      <div className="relative">{props.children}</div>
    </m.div>
  </TooltipPrimitive.Content>
)
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipContent, TooltipRoot, TooltipTrigger }

export { RootPortal as TooltipPortal } from "../portal"
