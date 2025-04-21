import { cn } from "@follow/utils/utils"
import * as SelectPrimitive from "@radix-ui/react-select"
import * as React from "react"

import { RootPortal } from "../portal"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = (
  {
    ref,
    size = "default",
    className,
    children,
    ...props
  }
) => (<SelectPrimitive.Trigger
  ref={ref}
  className={cn(
    "placeholder:text-muted-foreground flex w-full items-center justify-between whitespace-nowrap rounded-md bg-transparent disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
    "ring-accent/20 focus:border-accent/80 duration-200 focus:outline-none focus:ring-2",
    "border-border border",
    size === "sm" ? "h-7 p-2 text-sm" : "h-9 px-3 py-2 text-sm",
    "hover:border-accent/80",
    className,
  )}
  {...props}
>
  {children}
  <SelectPrimitive.Icon asChild>
    <i className="i-mingcute-down-line ml-2 size-4 shrink-0 opacity-50" />
  </SelectPrimitive.Icon>
</SelectPrimitive.Trigger>)
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton> & {
    ref: React.RefObject<React.ElementRef<typeof SelectPrimitive.ScrollUpButton>>;
  }
) => (<SelectPrimitive.ScrollUpButton
  ref={ref}
  className={cn("cursor-select flex items-center justify-center py-1", className)}
  {...props}
>
  <i className="i-mingcute-up-line" />
</SelectPrimitive.ScrollUpButton>)
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton> & {
    ref: React.RefObject<React.ElementRef<typeof SelectPrimitive.ScrollDownButton>>;
  }
) => (<SelectPrimitive.ScrollDownButton
  ref={ref}
  className={cn("cursor-select flex items-center justify-center py-1", className)}
  {...props}
>
  <i className="i-mingcute-down-line" />
</SelectPrimitive.ScrollDownButton>)
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = (
  {
    ref,
    className,
    children,
    position = "popper",
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    ref: React.RefObject<React.ElementRef<typeof SelectPrimitive.Content>>;
  }
) => (<RootPortal>
  <SelectPrimitive.Content
    ref={ref}
    className={cn(
      "shadow-perfect bg-popover text-popover-foreground relative max-h-96 min-w-32 overflow-hidden rounded-md border",
      position === "popper" && [
        "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      ],
      className,
    )}
    position={position}
    {...props}
  >
    <SelectScrollUpButton />
    <SelectPrimitive.Viewport
      className={cn(
        "p-1",
        position === "popper" &&
          "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
      )}
    >
      {children}
    </SelectPrimitive.Viewport>
    <SelectScrollDownButton />
  </SelectPrimitive.Content>
</RootPortal>)
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & {
    ref: React.RefObject<React.ElementRef<typeof SelectPrimitive.Label>>;
  }
) => (<SelectPrimitive.Label
  ref={ref}
  className={cn("px-2 py-1.5 text-sm font-semibold", className)}
  {...props}
/>)
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = (
  {
    ref,
    className,
    children,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    ref: React.RefObject<React.ElementRef<typeof SelectPrimitive.Item>>;
  }
) => (<SelectPrimitive.Item
  ref={ref}
  className={cn(
    "cursor-select focus:bg-theme-item-active focus:text-theme-foreground pointer-events-auto relative flex w-full items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className,
  )}
  {...props}
>
  <span className="absolute right-2 flex size-3.5 items-center justify-center">
    <SelectPrimitive.ItemIndicator>
      <i className="i-mingcute-check-line size-3" />
    </SelectPrimitive.ItemIndicator>
  </span>
  <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
</SelectPrimitive.Item>)
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> & {
    ref: React.RefObject<React.ElementRef<typeof SelectPrimitive.Separator>>;
  }
) => (<SelectPrimitive.Separator
  ref={ref}
  className={cn("bg-muted -mx-1 my-1 h-px", className)}
  {...props}
/>)
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
