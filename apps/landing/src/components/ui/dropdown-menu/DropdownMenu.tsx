'use client'

import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui'
import * as React from 'react'

import { clsxm } from '~/lib/cn'

import { RootPortal } from '../portal'

const DropdownMenu = DropdownMenuPrimitive.Root

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = ({
  ref,
  className,
  inset,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean
} & {
  ref?: React.Ref<React.ElementRef<
    typeof DropdownMenuPrimitive.SubTrigger
  > | null>
}) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={clsxm(
      'cursor-menu focus:bg-accent data-[state=open]:bg-accent flex items-center rounded-[5px] px-2.5 py-1 outline-none select-none focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'text-sm focus-within:outline-transparent',
      'h-[28px] w-full',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    {children}
    <i className="i-mingcute-right-line ml-auto size-3" />
  </DropdownMenuPrimitive.SubTrigger>
)
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
  ref?: React.Ref<React.ElementRef<
    typeof DropdownMenuPrimitive.SubContent
  > | null>
}) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={clsxm(
      'bg-material-medium backdrop-blur-background text-text border-border z-[60] min-w-32 overflow-hidden rounded-[6px] border p-1',
      'shadow-context-menu',
      'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
      className,
    )}
    {...props}
  />
)
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = ({
  ref,
  className,
  sideOffset = 4,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Content> | null>
}) => (
  <RootPortal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={clsxm(
        'bg-material-medium backdrop-blur-background text-text border-border z-[60] min-w-32 overflow-hidden rounded-[6px] border p-1',
        'shadow-context-menu',
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className,
      )}
      {...props}
    />
  </RootPortal>
)
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = ({
  ref,
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean
} & {
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Item> | null>
}) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={clsxm(
      'cursor-menu focus:bg-accent relative flex items-center rounded-[5px] px-2.5 py-1 transition-colors outline-none select-none focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'text-sm focus-within:outline-transparent',
      'h-[28px] w-full',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = ({
  ref,
  className,
  children,
  checked,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
  ref?: React.Ref<React.ElementRef<
    typeof DropdownMenuPrimitive.CheckboxItem
  > | null>
}) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={clsxm(
      'cursor-menu focus:bg-accent relative flex items-center rounded-[5px] py-1 pr-2.5 pl-8 transition-colors outline-none select-none focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'text-sm focus-within:outline-transparent',
      'h-[28px] w-full',
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <i className="i-mingcute-check-fill size-3" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
)
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuRadioItem = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> & {
  ref?: React.Ref<React.ElementRef<
    typeof DropdownMenuPrimitive.RadioItem
  > | null>
}) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={clsxm(
      'cursor-menu focus:bg-accent relative flex items-center rounded-[5px] py-1 pr-2.5 pl-8 transition-colors outline-none select-none focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'text-sm focus-within:outline-transparent',
      'h-[28px] w-full',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <i className="i-mingcute-check-fill size-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
)
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

const DropdownMenuLabel = ({
  ref,
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean
} & {
  ref?: React.Ref<React.ElementRef<typeof DropdownMenuPrimitive.Label> | null>
}) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={clsxm(
      'text-text px-2 py-1.5 font-semibold',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
)
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & {
  ref?: React.Ref<React.ElementRef<
    typeof DropdownMenuPrimitive.Separator
  > | null>
}) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={clsxm('backdrop-blur-background mx-2 my-1 h-px', className)}
    {...props}
  />
)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={clsxm(
        'text-text-secondary ml-auto text-xs tracking-widest opacity-60',
        className,
      )}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
