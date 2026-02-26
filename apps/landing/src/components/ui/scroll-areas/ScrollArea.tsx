'use client'

import { ScrollArea as ScrollAreaBase } from 'radix-ui'
import * as React from 'react'

import { clsxm } from '~/lib/cn'

import { ScrollElementContext } from './ctx'

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
    className={clsxm(
      'relative w-full flex-1 rounded-xl backdrop-blur-3xl transition-colors duration-150',
      'bg-zinc-500/50 hover:bg-zinc-500/70',
      'active:bg-zinc-500/70',
      'before:absolute before:-top-1/2 before:-left-1/2 before:h-full before:min-h-[44]',
      'before:w-full before:min-w-[44] before:-translate-x-full before:-translate-y-full before:content-[""]',

      className,
    )}
  />
)
Thumb.displayName = 'ScrollArea.Thumb'

const Scrollbar = ({
  ref: forwardedRef,
  className,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<typeof ScrollAreaBase.Scrollbar> & {
  ref?: React.Ref<React.ElementRef<typeof ScrollAreaBase.Scrollbar> | null>
}) => {
  const { orientation = 'vertical' } = rest
  return (
    <ScrollAreaBase.Scrollbar
      {...rest}
      ref={forwardedRef}
      className={clsxm(
        'flex w-2.5 touch-none p-0.5 select-none',
        orientation === 'horizontal'
          ? `h-2.5 w-full flex-col`
          : `w-2.5 flex-row`,
        'animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in mb-1 duration-200',
        className,
      )}
    >
      {children}
      <Thumb />
    </ScrollAreaBase.Scrollbar>
  )
}
Scrollbar.displayName = 'ScrollArea.Scrollbar'

const Viewport = ({
  ref: forwardedRef,
  className,

  focusable = true,
  ...rest
}: React.ComponentPropsWithoutRef<typeof ScrollAreaBase.Viewport> & {
  mask?: boolean
  focusable?: boolean
} & {
  ref?: React.Ref<React.ElementRef<typeof ScrollAreaBase.Viewport> | null>
}) => {
  const ref = React.useRef<HTMLDivElement>(null)

  React.useImperativeHandle(forwardedRef, () => ref.current as HTMLDivElement)
  return (
    <ScrollAreaBase.Viewport
      {...rest}
      ref={ref}
      tabIndex={focusable ? -1 : void 0}
      className={clsxm(
        'block size-full',

        className,
      )}
    />
  )
}
Viewport.displayName = 'ScrollArea.Viewport'

const Root = ({
  ref: forwardedRef,
  className,
  children,
  ...rest
}: React.ComponentPropsWithoutRef<typeof ScrollAreaBase.Root> & {
  ref?: React.Ref<React.ElementRef<typeof ScrollAreaBase.Root> | null>
}) => (
  <ScrollAreaBase.Root
    {...rest}
    scrollHideDelay={0}
    ref={forwardedRef}
    className={clsxm('overflow-hidden', className)}
  >
    {children}
  </ScrollAreaBase.Root>
)

Root.displayName = 'ScrollArea.Root'
export const ScrollArea = ({
  ref,
  flex,
  children,
  rootClassName,
  viewportClassName,
  scrollbarClassName,
  mask = false,
  onScroll,
  orientation = 'vertical',
  asChild = false,

  focusable = true,
  id,
  style,
}: React.PropsWithChildren & {
  rootClassName?: string
  viewportClassName?: string
  scrollbarClassName?: string
  flex?: boolean
  mask?: boolean
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void
  orientation?: 'vertical' | 'horizontal' | 'both'
  asChild?: boolean
  focusable?: boolean
  id?: string
  style?: React.CSSProperties
} & { ref?: React.Ref<HTMLDivElement | null> }) => {
  const [viewportRef, setViewportRef] = React.useState<HTMLDivElement | null>(
    null,
  )
  React.useImperativeHandle(ref, () => viewportRef as HTMLDivElement)

  return (
    <ScrollElementContext value={viewportRef}>
      <Root className={rootClassName} id={id} style={style}>
        <Viewport
          ref={setViewportRef}
          className={clsxm(
            flex ? '[&>div]:!flex [&>div]:!flex-col' : '',
            viewportClassName,
          )}
          mask={mask}
          asChild={asChild}
          onScroll={onScroll}
          focusable={focusable}
        >
          {children}
        </Viewport>
        {orientation === 'both' ? (
          <>
            <Scrollbar orientation="vertical" className={scrollbarClassName} />
            <Scrollbar
              orientation="horizontal"
              className={scrollbarClassName}
            />
          </>
        ) : (
          <Scrollbar orientation={orientation} className={scrollbarClassName} />
        )}
      </Root>
    </ScrollElementContext>
  )
}
