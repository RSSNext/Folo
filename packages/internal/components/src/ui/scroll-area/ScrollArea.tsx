import { stopPropagation } from "@follow/utils/dom"
import { cn } from "@follow/utils/utils"
import * as ScrollAreaBase from "@radix-ui/react-scroll-area"
import * as React from "react"

import { ScrollElementContext, ScrollElementEventsContext } from "./ctx"
import styles from "./index.module.css"

const Corner = ({
  ref: forwardedRef,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof ScrollAreaBase.Corner> & {
  ref?: React.Ref<React.ElementRef<typeof ScrollAreaBase.Corner> | null>
}) => <ScrollAreaBase.Corner {...rest} ref={forwardedRef} className={cn("bg-accent", className)} />

Corner.displayName = "ScrollArea.Corner"

const Thumb = ({
  ref: forwardedRef,
  className,
  ...rest
}: React.ComponentPropsWithoutRef<typeof ScrollAreaBase.Thumb> & {
  ref?: React.Ref<React.ElementRef<typeof ScrollAreaBase.Thumb> | null>
}) => (
  <ScrollAreaBase.Thumb
    {...rest}
    onClick={(e) => {
      e.stopPropagation()
      rest.onClick?.(e)
    }}
    ref={forwardedRef}
    className={cn(
      "relative w-full flex-1 rounded-xl transition-colors duration-150",
      "bg-fill-secondary hover:bg-fill",
      "active:bg-fill-vibrant",
      "before:absolute before:-left-1/2 before:-top-1/2 before:h-full before:min-h-[44]",
      'before:w-full before:min-w-[44] before:-translate-x-full before:-translate-y-full before:content-[""]',

      className,
    )}
  />
)
Thumb.displayName = "ScrollArea.Thumb"

const Scrollbar = ({
  ref: forwardedRef,
  className,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<typeof ScrollAreaBase.Scrollbar> & {
  ref?: React.Ref<React.ElementRef<typeof ScrollAreaBase.Scrollbar> | null>
}) => {
  const { orientation = "vertical" } = rest
  return (
    <ScrollAreaBase.Scrollbar
      {...rest}
      ref={forwardedRef}
      className={cn(
        "flex w-2.5 touch-none select-none p-0.5",
        orientation === "horizontal" ? `h-2.5 w-full flex-col` : `w-2.5 flex-row`,
        "animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
        className,
      )}
    >
      {children}
      <Thumb />
    </ScrollAreaBase.Scrollbar>
  )
}
Scrollbar.displayName = "ScrollArea.Scrollbar"

const Viewport = ({
  ref: forwardedRef,
  className,
  mask = false,
  focusable = true,
  ...rest
}: React.ComponentPropsWithoutRef<typeof ScrollAreaBase.Viewport> & {
  mask?: boolean
  focusable?: boolean
} & { ref?: React.Ref<React.ElementRef<typeof ScrollAreaBase.Viewport> | null> }) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const [shouldAddMask, setShouldAddMask] = React.useState(false)
  React.useLayoutEffect(() => {
    if (!mask) {
      setShouldAddMask(false)
      return
    }
    const $el = ref.current
    const $child = $el?.firstElementChild
    if (!$el) return
    if (!$child) return
    const handler = () => {
      setShouldAddMask($el.scrollHeight > $el.clientHeight + 48 * 2)
    }
    const observer = new ResizeObserver(handler)
    handler()
    observer.observe($child)

    return () => observer.disconnect()
  }, [mask])

  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement)
  return (
    <ScrollAreaBase.Viewport
      {...rest}
      ref={ref}
      tabIndex={focusable ? -1 : void 0}
      className={cn("block size-full", shouldAddMask && styles["mask-scroller"], className)}
    />
  )
}
Viewport.displayName = "ScrollArea.Viewport"

const Root = ({
  ref: forwardedRef,
  className,
  children,
  flex,
  ...rest
}: React.ComponentPropsWithoutRef<typeof ScrollAreaBase.Root> & {
  ref?: React.Ref<React.ElementRef<typeof ScrollAreaBase.Root> | null>
  flex?: boolean
}) => (
  <ScrollAreaBase.Root
    {...rest}
    scrollHideDelay={0}
    ref={forwardedRef}
    className={cn(
      "overflow-hidden",
      flex && "min-h-0", // Add explicit min-height for flex contexts
      className,
    )}
  >
    {children}
    <Corner />
  </ScrollAreaBase.Root>
)

Root.displayName = "ScrollArea.Root"
export const ScrollArea = ({
  ref,
  flex,
  children,
  rootClassName,
  viewportClassName,
  scrollbarClassName,
  mask = false,
  onScroll,
  orientation = "vertical",
  asChild = false,
  onUpdateMaxScroll,
  focusable = true,
  stopWheelPropagation = true,
}: React.PropsWithChildren & {
  rootClassName?: string
  viewportClassName?: string
  scrollbarClassName?: string
  flex?: boolean
  mask?: boolean
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  onUpdateMaxScroll?: () => void
  orientation?: "vertical" | "horizontal"
  asChild?: boolean
  focusable?: boolean
  stopWheelPropagation?: boolean
} & { ref?: React.Ref<HTMLDivElement | null> }) => {
  const [viewportRef, setViewportRef] = React.useState<HTMLDivElement | null>(null)
  React.useImperativeHandle(ref, () => viewportRef as HTMLDivElement)

  const events = React.useMemo(() => ({ onUpdateMaxScroll }), [onUpdateMaxScroll])

  return (
    <ScrollElementContext value={viewportRef}>
      <ScrollElementEventsContext value={events}>
        <Root className={rootClassName} flex={flex}>
          <Viewport
            ref={setViewportRef}
            onWheel={stopWheelPropagation ? stopPropagation : undefined}
            className={cn(
              flex && "[&>div]:!flex [&>div]:!min-h-0 [&>div]:!flex-col", // Add min-h-0 to flex children
              viewportClassName,
            )}
            mask={mask}
            asChild={asChild}
            onScroll={onScroll}
            focusable={focusable}
          >
            {children}
          </Viewport>
          <Scrollbar orientation={orientation} className={scrollbarClassName} />
        </Root>
      </ScrollElementEventsContext>
    </ScrollElementContext>
  )
}
