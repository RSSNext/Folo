import { cn } from "@follow/utils/utils"
import type { TabsProps } from "@radix-ui/react-tabs"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva } from "class-variance-authority"
import * as React from "react"

const TabsIdContext = React.createContext<string | null>(null)
const SetTabIndicatorContext = React.createContext<
  React.Dispatch<
    React.SetStateAction<{
      w: number | undefined
      x: number | undefined
    }>
  >
>(() => {})

const TabVariantContext = React.createContext<"default" | "rounded" | undefined>(undefined)

const TabIndicatorContext = React.createContext<{
  w: number | undefined
  x: number | undefined
} | null>(null)

const Tabs: ComponentWithRef<
  TabsProps &
    React.RefAttributes<HTMLDivElement> & {
      variant?: "default" | "rounded"
    },
  HTMLDivElement
> = ({ ref, ...props }) => {
  const { children, variant, ...rest } = props
  const [indicator, setIndicator] = React.useState<{
    w: number | undefined
    x: number | undefined
  }>({
    w: undefined,
    x: undefined,
  })
  const id = React.useId()

  return (
    <TabsIdContext value={id}>
      <SetTabIndicatorContext value={setIndicator}>
        <TabsPrimitive.Root {...rest} ref={ref}>
          <TabIndicatorContext value={indicator}>
            <TabVariantContext value={variant}>{children}</TabVariantContext>
          </TabIndicatorContext>
        </TabsPrimitive.Root>
      </SetTabIndicatorContext>
    </TabsIdContext>
  )
}

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}
const TabsList = ({
  ref,
  className,
  ...props
}: TabsListProps & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.List> | null>
}) => {
  const indicator = React.use(TabIndicatorContext)
  const variant = React.use(TabVariantContext)

  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "text-text-secondary relative inline-flex items-center justify-center",
        className,
      )}
    >
      {props.children}
      {indicator?.x !== undefined && (
        <span
          className={cn(
            "absolute left-0 duration-200 will-change-[transform,width]",
            variant === "rounded"
              ? "bg-material-medium group-hover:bg-theme-item-hover inset-0 z-0 h-full rounded-lg"
              : "bg-accent bottom-0 h-0.5 rounded",
          )}
          style={{
            width: indicator.w,
            transform: indicator.x ? `translate3d(${indicator.x}px, 0, 0)` : undefined,
          }}
        />
      )}
    </TabsPrimitive.List>
  )
}
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva("", {
  variants: {
    variant: {
      default: "py-1.5 border-b-2 border-transparent data-[state=active]:text-accent",
      rounded: "!py-1 !px-3 bg-transparent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {}
const TabsTrigger = ({
  ref,
  className,
  children,
  ...props
}: TabsTriggerProps & { ref?: React.Ref<HTMLDivElement | null> }) => {
  const variant = React.use(TabVariantContext)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  React.useImperativeHandle(ref, () => triggerRef.current!, [])

  const setIndicator = React.use(SetTabIndicatorContext)

  React.useLayoutEffect(() => {
    if (!triggerRef.current) return

    const handler = () => {
      const trigger = triggerRef.current as HTMLElement
      const isSelect = trigger.dataset.state === "active"
      if (isSelect) {
        setIndicator({
          w: trigger.clientWidth,
          x: trigger.offsetLeft,
        })
      }
    }

    handler()
    const trigger = triggerRef.current as HTMLElement
    const ob = new MutationObserver(handler)
    ob.observe(trigger, {
      attributes: true,
      attributeFilter: ["data-state"],
    })

    return () => {
      ob.disconnect()
    }
  }, [setIndicator])

  return (
    <TabsPrimitive.Trigger
      ref={triggerRef as any}
      className={cn(
        "ring-offset-background data-[state=active]:text-text inline-flex items-center justify-center whitespace-nowrap px-3 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
        "group relative z-[1]",
        tabsTriggerVariants({ variant }),
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = ({
  ref,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & {
  ref?: React.Ref<React.ElementRef<typeof TabsPrimitive.Content> | null>
}) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("ring-offset-background mt-2 focus-visible:outline-none", className)}
    {...props}
  />
)
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsList, TabsTrigger }
