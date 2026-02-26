import { Tooltip as TooltipPrimitive } from '@base-ui-components/react/tooltip'
import { m } from 'motion/react'
import * as React from 'react'

import { cn } from '~/lib/cn'
import { Spring } from '~/lib/spring'

import { tooltipStyle } from './styles'

// Base UI Tooltip Provider wrapper
const TooltipProvider = TooltipPrimitive.Provider

// Simplified wrapper component that combines Provider and Root
const Tooltip = ({
  children,
  delayDuration = 200,
  ...props
}: {
  children: React.ReactNode
  delayDuration?: number
}) => (
  <TooltipProvider delay={delayDuration}>
    <TooltipPrimitive.Root {...props}>{children}</TooltipPrimitive.Root>
  </TooltipProvider>
)

const TooltipTrigger = TooltipPrimitive.Trigger

const TooltipContent = ({
  className,
  sideOffset = 4,
  children,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Popup> & {
  sideOffset?: number
  ref?: React.Ref<HTMLDivElement>
}) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Positioner
      className={cn(tooltipStyle.positioner)}
      sideOffset={sideOffset}
    >
      <TooltipPrimitive.Popup
        ref={ref}
        className={cn(tooltipStyle.content, className)}
        {...props}
      >
        <m.div
          initial={{ opacity: 0.82, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={Spring.snappy(0.1)}
        >
          <TooltipPrimitive.Arrow className="z-50 [&>svg]:fill-white dark:[&>svg]:fill-neutral-950 dark:[&>svg]:drop-shadow-[0_0_1px_theme(colors.background/0.5)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="8"
              viewBox="0 0 16 8"
            >
              <path d="M0 8L8 0L16 8" />
            </svg>
          </TooltipPrimitive.Arrow>
          {children}
        </m.div>
      </TooltipPrimitive.Popup>
    </TooltipPrimitive.Positioner>
  </TooltipPrimitive.Portal>
)

TooltipContent.displayName = 'TooltipContent'

const TooltipRoot = TooltipPrimitive.Root

export { Tooltip, TooltipContent, TooltipProvider, TooltipRoot, TooltipTrigger }
