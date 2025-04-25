import { cn } from "@follow/utils/utils"
import * as SelectPrimitive from "@radix-ui/react-select"
import * as React from "react"

import { Divider } from "../divider/Divider"
import { RootPortal } from "../portal"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    size?: "default" | "sm"
  }
>(({ size = "default", className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex w-full items-center justify-between whitespace-nowrap rounded-[5px] bg-transparent",
      "outline-none focus-within:outline-transparent",
      "border-border border",
      size === "sm" ? "h-7 px-2.5 text-sm" : "h-9 px-2.5 py-1.5 text-sm",
      "placeholder:text-text-secondary",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "[&>span]:line-clamp-1",
      className,
      props.disabled && "cursor-not-allowed opacity-30",
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <i className="i-mingcute-down-line ml-2 size-3.5 shrink-0 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("cursor-menu flex items-center justify-center py-1", className)}
    {...props}
  >
    <i className="i-mingcute-up-line size-3.5" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("cursor-menu flex items-center justify-center py-1", className)}
    {...props}
  >
    <i className="i-mingcute-down-line size-3.5" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <RootPortal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "bg-material-medium backdrop-blur-background text-text z-[60] max-h-96 min-w-32 overflow-hidden rounded-[6px] border p-1",
        "shadow-context-menu",
        "motion-scale-in-75 motion-duration-150 text-body lg:animate-none",
        className,
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-0",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </RootPortal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("text-text px-2 py-1.5 font-semibold", inset && "pl-8", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, children, inset, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "cursor-menu focus:bg-theme-selection-active focus:text-theme-selection-foreground relative flex select-none items-center rounded-[5px] px-2.5 py-1 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[highlighted]:bg-theme-selection-hover focus-within:outline-transparent",
      "h-[28px] w-full",
      inset && "pl-8",
      className,
    )}
    {...props}
  >
    <span className="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <i className="i-mgc-check-filled size-3" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ ...props }, ref) => (
  <SelectPrimitive.Separator
    className="backdrop-blur-background mx-2 my-1 h-px"
    asChild
    ref={ref}
    {...props}
  >
    <Divider />
  </SelectPrimitive.Separator>
))
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
