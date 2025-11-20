import { cn } from "@follow/utils/utils"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import * as React from "react"

import { Divider } from "../divider/Divider.js"
import { RootPortal } from "../portal/index.jsx"

const styles = {
  content: {
    backgroundImage:
      "linear-gradient(to bottom right, rgba(var(--color-background) / 0.98), rgba(var(--color-background) / 0.95))",
    boxShadow:
      "0 6px 20px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(0, 0, 0, 0.04), 0 4px 16px hsl(var(--fo-a) / 0.06), 0 2px 8px hsl(var(--fo-a) / 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)",
  } as React.CSSProperties,
  innerGlow: {
    background:
      "linear-gradient(to bottom right, hsl(var(--fo-a) / 0.01), transparent, hsl(var(--fo-a) / 0.01))",
  } as React.CSSProperties,
}

const ContextMenu = ContextMenuPrimitive.Root
const ContextMenuTrigger = ContextMenuPrimitive.Trigger
const ContextMenuGroup = ContextMenuPrimitive.Group
const ContextMenuSub = ContextMenuPrimitive.Sub
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

const ContextMenuSubTrigger = ({
  ref,
  className,
  inset,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
  inset?: boolean
} & { ref?: React.Ref<React.ElementRef<typeof ContextMenuPrimitive.SubTrigger> | null> }) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "cursor-menu focus:bg-accent/30 data-[state=open]:bg-accent/30 flex select-none items-center rounded-[5px] px-2.5 py-1.5 outline-none",
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
)
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

const ContextMenuSubContent = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent> & {
  ref?: React.Ref<React.ElementRef<typeof ContextMenuPrimitive.SubContent> | null>
}) => (
  <RootPortal>
    <ContextMenuPrimitive.SubContent
      ref={ref}
      className={cn(
        "text-text text-body",
        "min-w-32 overflow-hidden",
        "rounded-[6px] p-1",
        "backdrop-blur-2xl",
        "z-[61]",
        "relative",
        "dark:border-border/50 dark:border",
        className,
      )}
      style={styles.content}
      {...props}
    >
      {/* Inner glow layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={styles.innerGlow}
      />
      {/* Content wrapper */}
      <div className="relative">{props.children}</div>
    </ContextMenuPrimitive.SubContent>
  </RootPortal>
)
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

const ContextMenuContent = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof ContextMenuPrimitive.Content> | null>
}) => (
  <RootPortal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "text-text z-[60] min-w-32 overflow-hidden rounded-[6px] p-1",
        "backdrop-blur-2xl",
        "motion-scale-in-75 motion-duration-150 text-body lg:animate-none",
        "relative",
        "dark:border-border/50 dark:border",
        className,
      )}
      style={styles.content}
      {...props}
    >
      {/* Inner glow layer */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[6px]"
        style={styles.innerGlow}
      />
      {/* Content wrapper */}
      <div className="relative">{props.children}</div>
    </ContextMenuPrimitive.Content>
  </RootPortal>
)
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

const ContextMenuItem = ({
  ref,
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean
} & { ref?: React.Ref<React.ElementRef<typeof ContextMenuPrimitive.Item> | null> }) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "cursor-menu focus:bg-accent/30 relative flex select-none items-center rounded-[5px] px-2.5 py-1 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "data-[highlighted]:bg-mix-background/accent-5/1 focus-within:outline-transparent",
      "h-[28px]",
      inset && "pl-8",
      className,
    )}
    {...props}
  />
)
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

const ContextMenuCheckboxItem = ({
  ref,
  className,
  children,
  checked,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem> & {
  ref?: React.Ref<React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem> | null>
}) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "cursor-checkbox focus:bg-accent/30 relative flex select-none items-center rounded-[5px] px-8 py-1.5 outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
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
)
ContextMenuCheckboxItem.displayName = ContextMenuPrimitive.CheckboxItem.displayName

const ContextMenuLabel = ({
  ref,
  className,
  inset,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
  inset?: boolean
} & { ref?: React.Ref<React.ElementRef<typeof ContextMenuPrimitive.Label> | null> }) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn("text-text px-2 py-1.5 font-semibold", inset && "pl-8", className)}
    {...props}
  />
)
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

const ContextMenuSeparator = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator> & {
  ref?: React.Ref<React.ElementRef<typeof ContextMenuPrimitive.Separator> | null>
}) => (
  <ContextMenuPrimitive.Separator
    className="backdrop-blur-background mx-2 my-1 h-px"
    asChild
    ref={ref}
    {...props}
  >
    <Divider />
  </ContextMenuPrimitive.Separator>
)
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
