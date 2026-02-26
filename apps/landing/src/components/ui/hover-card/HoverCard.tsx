'use client'

import { HoverCard as HoverCardPrimitive } from 'radix-ui'
import * as React from 'react'

import { clsxm } from '~/lib/cn'

import { RootPortal } from '../portal'

type HoverCardProps = React.ComponentProps<typeof HoverCardPrimitive.Root>

type HoverCardTriggerProps = React.ComponentProps<
  typeof HoverCardPrimitive.Trigger
>

type HoverCardContentProps = React.ComponentProps<
  typeof HoverCardPrimitive.Content
>

const HoverCard = HoverCardPrimitive.Root

const HoverCardTrigger = HoverCardPrimitive.Trigger

const HoverCardContent = ({
  ref,
  className,
  align = 'center',
  sideOffset = 8,
  ...props
}: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<
    typeof HoverCardPrimitive.Content
  > | null>
}) => (
  <RootPortal>
    <HoverCardPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={clsxm(
        'bg-material-high/95 backdrop-blur-background text-text border-border z-[60] w-[320px] max-w-[calc(100vw-2rem)] rounded-[12px] border p-4 shadow-lg',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2',
        className,
      )}
      {...props}
    />
  </RootPortal>
)
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

const HoverCardArrow = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Arrow> & {
  ref?: React.RefObject<React.ElementRef<
    typeof HoverCardPrimitive.Arrow
  > | null>
}) => (
  <HoverCardPrimitive.Arrow
    ref={ref}
    className={clsxm('fill-border/80 text-border/80', className)}
    {...props}
  />
)
HoverCardArrow.displayName = HoverCardPrimitive.Arrow.displayName

export {
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  type HoverCardContentProps,
  type HoverCardProps,
  HoverCardTrigger,
  type HoverCardTriggerProps,
}
