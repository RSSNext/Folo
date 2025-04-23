import { cn } from "@follow/utils/utils"
import type { TabsProps } from "@radix-ui/react-tabs"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cva } from "class-variance-authority"
import * as React from "react"

const TabsIdContext = React.createContext<string | null>(null)
const SetTabIndicatorContext = React.createContext<
  React.Dispatch<
    React.SetStateAction<{
      w: number
      x: number
    }>
  >
>(() => {})

const TabVariantContext = React.createContext<"default" | "rounded" | undefined>(undefined)

const TabIndicatorContext = React.createContext<{
  w: number
  x: number
} | null>(null)

const Tabs: React.ForwardRefExoticComponent<
  TabsProps &
    React.RefAttributes<HTMLDivElement> & {
      variant?: "default" | "rounded"
    }
> = React.forwardRef((props, ref) => {
  const { children, variant, ...rest } = props
  const [indicator, setIndicator] = React.useState({
    w: 0,
    x: 0,
  })
  const id = React.useId()

  return (
    <TabsIdContext.Provider value={id}>
      <SetTabIndicatorContext.Provider value={setIndicator}>
        <TabsPrimitive.Root {...rest} ref={ref}>
          <TabIndicatorContext.Provider value={indicator}>
            <TabVariantContext.Provider value={variant}>{children}</TabVariantContext.Provider>
          </TabIndicatorContext.Provider>
        </TabsPrimitive.Root>
      </SetTabIndicatorContext.Provider>
    </TabsIdContext.Provider>
  )
})

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {}
const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, ...props }, ref) => {
    const indicator = React.useContext(TabIndicatorContext)
    const variant = React.useContext(TabVariantContext)

    return (
      <TabsPrimitive.List
        ref={ref}
        className={cn(
          "text-text-secondary relative inline-flex items-center justify-center",
          className,
        )}
      >
        {props.children}

        <span
          className={cn(
            "absolute left-0 duration-200 will-change-[transform,width]",
            variant === "rounded"
              ? "bg-material-medium group-hover:bg-theme-item-hover inset-0 z-0 h-full rounded-lg"
              : "bg-accent bottom-0 h-0.5 rounded",
          )}
          style={{
            width: indicator?.w,
            transform: `translate3d(${indicator?.x}px, 0, 0)`,
          }}
        />
      </TabsPrimitive.List>
    )
  },
)
TabsList.displayName = TabsPrimitive.List.displayName

const tabsTriggerVariants = cva("", {
  variants: {
    variant: {
      default:
        "py-1.5 border-b-2 border-transparent data-[state=active]:text-accent dark:data-[state=active]:text-theme-accent-500",
      rounded: "!py-1 !px-3 bg-transparent",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {}
const TabsTrigger = React.forwardRef<HTMLDivElement, TabsTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const variant = React.useContext(TabVariantContext)
    const triggerRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => triggerRef.current!, [])

    const setIndicator = React.useContext(SetTabIndicatorContext)

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
          "ring-offset-background data-[state=active]:text-theme-foreground inline-flex items-center justify-center whitespace-nowrap px-3 text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50",
          "group relative z-[1]",
          tabsTriggerVariants({ variant }),
        )}
        {...props}
      >
        {children}
      </TabsPrimitive.Trigger>
    )
  },
)
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("ring-offset-background mt-2 focus-visible:outline-none", className)}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsContent, TabsList, TabsTrigger }
