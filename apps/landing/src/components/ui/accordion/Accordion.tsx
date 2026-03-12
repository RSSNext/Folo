'use client'

/**
 * @see https://www.zhangxinxu.com/wordpress/2024/06/css-transition-behavior/
 * @see https://www.zhangxinxu.com/wordpress/2024/11/css-calc-interpolate-size/
 */
import * as AccordionPrimitive from '@radix-ui/react-accordion'
import type { FC } from 'react'
import * as React from 'react'
import { createContext, use, useState } from 'react'

import { cn } from '~/lib/cn'

interface CollapseContextValue {
  openStates: Record<string, boolean>
  setOpenState: (id: string, open: boolean) => void
}

const CollapseContext = createContext<CollapseContextValue | null>(null)

const useCollapseContext = () => {
  const ctx = use(CollapseContext)
  if (!ctx) {
    throw new Error('useCollapseContext must be used within CollapseGroup')
  }
  return ctx
}

interface CollapseGroupProps {
  defaultOpenId?: string
  onOpenChange?: (state: Record<string, boolean>) => void
  children: React.ReactNode
}

export const CollapseCssGroup: FC<CollapseGroupProps> = ({
  children,
  defaultOpenId,
  onOpenChange,
}) => {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    return defaultOpenId ? { [defaultOpenId]: true } : {}
  })

  const setOpenState = React.useCallback(
    (id: string, open: boolean) => {
      setOpenStates((prev) => {
        const newState = { ...prev, [id]: open }
        onOpenChange?.(newState)
        return newState
      })
    },
    [onOpenChange],
  )

  const ctxValue = React.useMemo<CollapseContextValue>(
    () => ({
      openStates,
      setOpenState,
    }),
    [openStates, setOpenState],
  )

  return <CollapseContext value={ctxValue}>{children}</CollapseContext>
}

interface CollapseProps {
  title: React.ReactNode
  hideArrow?: boolean
  defaultOpen?: boolean
  isOpened?: boolean // For controlled usage
  collapseId?: string
  onOpenChange?: (isOpened: boolean) => void
  contentClassName?: string
  className?: string
  children: React.ReactNode
  innerClassName?: string
}

export const CollapseCss: FC<CollapseProps> = ({
  title,
  hideArrow,
  defaultOpen = false,
  isOpened: controlledIsOpened,
  collapseId,
  onOpenChange,
  contentClassName,
  className,
  innerClassName,
  children,
}) => {
  const reactId = React.useId()
  const id = collapseId ?? reactId
  const { openStates, setOpenState } = useCollapseContext()

  // Use controlled value if provided, otherwise use context state or defaultOpen
  const isOpened = controlledIsOpened ?? openStates[id] ?? defaultOpen

  const handleToggle = React.useCallback(() => {
    const newOpened = !isOpened
    // Only update context state if not controlled
    if (controlledIsOpened === undefined) {
      setOpenState(id, newOpened)
    }
    onOpenChange?.(newOpened)
  }, [id, isOpened, controlledIsOpened, setOpenState, onOpenChange])

  return (
    <div
      className={cn('flex flex-col', className)}
      data-state={isOpened ? 'open' : 'hidden'}
    >
      <div
        className="relative flex w-full cursor-pointer items-center justify-between"
        onClick={controlledIsOpened === undefined ? handleToggle : undefined}
      >
        <span className="w-0 shrink grow truncate">{title}</span>
        {!hideArrow && (
          <div className="text-text-secondary mr-4 inline-flex shrink-0 items-center">
            <i
              className={cn(
                'i-mingcute-down-line transition-transform duration-300 ease-in-out',
                isOpened ? 'rotate-180' : '',
              )}
            />
          </div>
        )}
      </div>
      <CollapseCssContent
        isOpened={isOpened}
        className={contentClassName}
        innerClassName={innerClassName}
      >
        {children}
      </CollapseCssContent>
    </div>
  )
}

interface CollapseContentProps {
  isOpened: boolean
  className?: string
  children: React.ReactNode
  innerClassName?: string
}

const CollapseCssContent: FC<CollapseContentProps> = ({
  isOpened,
  className,
  children,
  innerClassName,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null)

  return (
    <div
      ref={contentRef}
      className={cn(
        'overflow-hidden [transition-behavior:allow-discrete] [interpolate-size:allow-keywords]',
        'transition-[height,opacity,display] duration-300 ease-in-out',
        '[@starting-style]:h-0 [@starting-style]:opacity-0',
        className,
        isOpened
          ? 'block h-[calc-size(auto)] opacity-100'
          : 'hidden h-0 opacity-0',
      )}
      data-state={isOpened ? 'open' : 'closed'}
    >
      <div
        className={cn(
          'transition-transform duration-300 ease-in-out',
          '[@starting-style]:translate-y-[-8px]',
          isOpened ? 'translate-y-0' : 'translate-y-[-8px]',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

// Radix Accordion Components
const AccordionRoot = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root> & {
  ref?: React.RefObject<React.ElementRef<typeof AccordionPrimitive.Root> | null>
}) => <AccordionPrimitive.Root ref={ref} className={cn(className)} {...props} />
AccordionRoot.displayName = 'Accordion'

const AccordionItem = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & {
  ref?: React.RefObject<React.ElementRef<typeof AccordionPrimitive.Item> | null>
}) => <AccordionPrimitive.Item ref={ref} className={cn(className)} {...props} />
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
  ref?: React.RefObject<React.ElementRef<
    typeof AccordionPrimitive.Trigger
  > | null>
}) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between text-left font-medium transition-all [&[data-state=open]>i]:rotate-180',
        className,
      )}
      {...props}
    >
      {children}
      <i className="i-mingcute-down-line size-4 shrink-0 text-text-secondary transition-transform duration-200" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
)
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & {
  ref?: React.RefObject<React.ElementRef<
    typeof AccordionPrimitive.Content
  > | null>
}) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn('pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
)
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export const Accordion = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
})
