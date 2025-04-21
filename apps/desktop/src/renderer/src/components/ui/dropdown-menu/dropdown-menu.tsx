import { RootPortal } from "@follow/components/ui/portal/index.js"
import { useTypeScriptHappyCallback } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import * as React from "react"

import { useHotkeyScope } from "~/hooks/common"

const DropdownMenu: typeof DropdownMenuPrimitive.Root = (props) => {
  const [open, setOpen] = React.useState(!!props.open)
  useHotkeyScope("DropdownMenu", open)

  return (
    <DropdownMenuPrimitive.Root
      {...props}
      onOpenChange={useTypeScriptHappyCallback(
        (open) => {
          setOpen(open)
          props.onOpenChange?.(open)
        },
        [props.onOpenChange],
      )}
    />
  )
}

const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

const DropdownMenuGroup = DropdownMenuPrimitive.Group

const DropdownMenuPortal = DropdownMenuPrimitive.Portal

const DropdownMenuSub = DropdownMenuPrimitive.Sub

const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

const DropdownMenuSubTrigger = (
  {
    ref,
    className,
    inset,
    children,
    ...props
  }
) => (<DropdownMenuPrimitive.SubTrigger
  ref={ref}
  className={cn(
    "cursor-menu focus:bg-theme-item-hover data-[state=open]:bg-theme-item-active flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none",
    inset && "pl-8",
    className,
  )}
  {...props}
>
  {children}
  <i className="i-mingcute-down-line ml-auto size-4" />
</DropdownMenuPrimitive.SubTrigger>)
DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName

const DropdownMenuSubContent = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> & {
    ref: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.SubContent>>;
  }
) => (<DropdownMenuPrimitive.SubContent
  ref={ref}
  className={cn(
    "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-32 overflow-hidden rounded-md border p-1 shadow-lg",
    className,
  )}
  {...props}
/>)
DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName

const DropdownMenuContent = (
  {
    ref,
    className,
    sideOffset = 4,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> & {
    ref: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.Content>>;
  }
) => {
  return (
    <RootPortal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "shadow-context-menu bg-theme-background text-theme-foreground z-50 min-w-32 overflow-hidden rounded-md border p-1",
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className,
        )}
        {...props}
      />
    </RootPortal>
  )
}
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

const DropdownMenuItem = (
  {
    ref,
    className,
    inset,
    icon,
    active,
    ...props
  }
) => (<DropdownMenuPrimitive.Item
  ref={ref}
  className={cn(
    "cursor-menu focus:bg-theme-item-hover data-[state=open]:bg-theme-item-active relative flex select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    inset && "pl-8",
    "focus-within:!outline-transparent",
    className,
  )}
  {...props}
>
  {!!icon && (
    <span className="mr-1.5 inline-flex size-4 items-center justify-center">
      {typeof icon === "function" ? icon({ isActive: active }) : icon}
    </span>
  )}
  {props.children}
  {/* Justify Fill */}
  {!!icon && <span className="ml-1.5 size-4" />}
</DropdownMenuPrimitive.Item>)
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

const DropdownMenuCheckboxItem = (
  {
    ref,
    className,
    children,
    checked,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> & {
    ref: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>>;
  }
) => (<DropdownMenuPrimitive.CheckboxItem
  ref={ref}
  className={cn(
    "cursor-menu focus:bg-theme-item-hover data-[state=open]:bg-theme-item-active relative flex select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    className,
  )}
  checked={checked}
  {...props}
>
  <span className="absolute left-2 flex size-3.5 items-center justify-center">
    <DropdownMenuPrimitive.ItemIndicator>
      <i className="i-mingcute-checkbox-line size-4" />
    </DropdownMenuPrimitive.ItemIndicator>
  </span>
  {children}
</DropdownMenuPrimitive.CheckboxItem>)
DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName

const DropdownMenuLabel = (
  {
    ref,
    className,
    inset,
    ...props
  }
) => (<DropdownMenuPrimitive.Label
  ref={ref}
  className={cn("px-2 py-1.5 text-sm font-semibold", inset && "pl-8", className)}
  {...props}
/>)
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

const DropdownMenuSeparator = (
  {
    ref,
    className,
    ...props
  }: React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> & {
    ref: React.RefObject<React.ElementRef<typeof DropdownMenuPrimitive.Separator>>;
  }
) => (<DropdownMenuPrimitive.Separator
  ref={ref}
  className={cn("bg-muted -mx-1 my-1 h-px", className)}
  {...props}
/>)
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

const DropdownMenuShortcut = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("ml-auto text-xs tracking-widest opacity-60", className)} {...props} />
)
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
}
