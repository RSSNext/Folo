import { Select as SelectPrimitive } from 'radix-ui'
import * as React from 'react'

import { clsxm, focusRing } from '~/lib/cn'

import { Divider } from '../divider/Divider'
import { RootPortal } from '../portal'

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = ({
  ref,
  size = 'default',
  className,
  children,
  loading,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
  size?: 'default' | 'sm'
  loading?: boolean
} & {
  ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Trigger> | null>
}) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={clsxm(
      'flex w-full items-center justify-between rounded-lg bg-transparent whitespace-nowrap',
      focusRing,
      'transition-all duration-200 outline-none',
      'border-border border',
      size === 'sm' ? 'h-8 px-3 text-sm' : 'h-9 px-3.5 py-2 text-sm',
      'placeholder:text-text-secondary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      '[&>span]:line-clamp-1',
      'shadow-sm shadow-zinc-100 hover:shadow dark:shadow-zinc-800',
      className,
      props.disabled && 'cursor-not-allowed opacity-30',
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      {loading ? (
        <i className="i-mingcute-loading-3-line text-text-tertiary size-4 animate-spin" />
      ) : (
        <i className="i-mingcute-down-line text-text-secondary -mr-1 ml-2 size-4 shrink-0 opacity-60 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      )}
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & {
  ref?: React.Ref<React.ElementRef<
    typeof SelectPrimitive.ScrollUpButton
  > | null>
}) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={clsxm(
      'cursor-menu flex items-center justify-center py-1',
      className,
    )}
    {...props}
  >
    <i className="i-mingcute-up-line size-3.5" />
  </SelectPrimitive.ScrollUpButton>
)
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> & {
  ref?: React.Ref<React.ElementRef<
    typeof SelectPrimitive.ScrollDownButton
  > | null>
}) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={clsxm(
      'cursor-menu flex items-center justify-center py-1',
      className,
    )}
    {...props}
  >
    <i className="i-mingcute-down-line size-3.5" />
  </SelectPrimitive.ScrollDownButton>
)
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = ({
  ref,
  className,
  children,
  position = 'item-aligned',
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Content> | null>
}) => (
  <RootPortal>
    <SelectPrimitive.Content
      ref={ref}
      className={clsxm(
        'bg-material-medium backdrop-blur-background no-drag-region text-text border-border pointer-events-auto z-[60] max-h-96 min-w-32 overflow-hidden rounded-[6px] border p-1',
        'shadow-context-menu',
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={clsxm(
          'p-0',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </RootPortal>
)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = ({
  ref,
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & {
  inset?: boolean
} & {
  ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Label> | null>
}) => (
  <SelectPrimitive.Label
    ref={ref}
    className={clsxm(
      'text-text px-2 py-1.5 font-semibold',
      inset && 'pl-8',
      className,
    )}
    {...props}
  />
)
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = ({
  ref,
  className,
  children,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  inset?: boolean
} & {
  ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Item> | null>
}) => (
  <SelectPrimitive.Item
    ref={ref}
    className={clsxm(
      'cursor-menu focus:bg-accent relative flex items-center rounded-[5px] px-2.5 py-1 outline-none select-none focus:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      'data-[highlighted]:bg-accent text-sm focus-within:outline-transparent',
      'h-[28px] w-full',
      inset && 'pl-8',
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <i className="i-mingcute-check-fill size-3" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
)
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & {
  ref?: React.Ref<React.ElementRef<typeof SelectPrimitive.Separator> | null>
}) => (
  <SelectPrimitive.Separator
    className="backdrop-blur-background mx-2 my-1 h-px"
    asChild
    ref={ref}
    {...props}
  >
    <Divider />
  </SelectPrimitive.Separator>
)
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
}
