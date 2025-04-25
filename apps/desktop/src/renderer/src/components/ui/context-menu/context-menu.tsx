import { Divider } from "@follow/components/ui/divider/Divider.js"
import { RootPortal } from "@follow/components/ui/portal/index.jsx"
import { cn } from "@follow/utils/utils"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import * as React from "react"

const ContextMenu = ContextMenuPrimitive.Root
const ContextMenuTrigger = ContextMenuPrimitive.Trigger
const ContextMenuGroup = ContextMenuPrimitive.Group
const ContextMenuSub = ContextMenuPrimitive.Sub
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "cursor-menu focus:bg-theme-selection-active focus:text-theme-selection-foreground data-[state=open]:bg-theme-selection-active data-[state=open]:text-theme-selection-foreground flex select-none items-center rounded-[5px] px-2.5 py-1.5 outline-none",
      inset && "pl-8",
      "center gap-2",
      className,
      props.disabled && "cursor-not-allowed opacity-30",
    )}
    {...props}
  >
    {children}
    <i className="i-mingcute-right-line -mr-1 ml-auto size-3.5" />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <RootPortal>
    <ContextMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "bg-material-medium backdrop-blur-background text-text text-body",
        "min-w-32 overflow-hidden",
        "rounded-[6px] border p-1",
        "shadow-context-menu",
        "z-[61]",
        className,
      )}
      {...props}
    />
  </RootPortal>
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <RootPortal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "bg-material-medium backdrop-blur-background text-text shadow-context-menu z-[60] min-w-32 overflow-hidden rounded-[6px] border p-1",
        "motion-scale-in-75 motion-duration-150 text-body lg:animate-none",
        className,
      )}
      {...props}
    />
  </RootPortal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "cursor-menu focus:bg-theme-selection-active focus:text-theme-selection-foreground relative flex select-none items-center rounded-[5px] px-2.5 py-1 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[highlighted]:bg-theme-selection-hover focus-within:outline-transparent",
      "h-[28px]",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "cursor-checkbox focus:bg-theme-selection-active focus:text-theme-selection-foreground relative flex select-none items-center rounded-[5px] px-8 py-1.5 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "focus-within:outline-transparent",
      "h-[28px]",
      className,
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator asChild>
        <i className="i-mgc-check-filled size-3" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName

const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn("text-text px-2 py-1.5 font-semibold", inset && "pl-8", className)}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    className="backdrop-blur-background mx-2 my-1 h-px"
    asChild
    ref={ref}
    {...props}
  >
    <Divider />
  </ContextMenuPrimitive.Separator>
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

export {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
}

export { RootPortal as ContextMenuPortal } from "@follow/components/ui/portal/index.jsx"
