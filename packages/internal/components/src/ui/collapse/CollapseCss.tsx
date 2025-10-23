/**
 * @see https://www.zhangxinxu.com/wordpress/2024/06/css-transition-behavior/
 * @see https://www.zhangxinxu.com/wordpress/2024/11/css-calc-interpolate-size/
 */
import { cn } from "@follow/utils/utils"
import type { FC } from "react"
import * as React from "react"
import { createContext, use, useState } from "react"

interface CollapseContextValue {
  openStates: Record<string, boolean>
  setOpenState: (id: string, open: boolean) => void
}

const CollapseContext = createContext<CollapseContextValue | null>(null)

const useCollapseContext = () => {
  const ctx = use(CollapseContext)
  if (!ctx) {
    throw new Error("useCollapseContext must be used within CollapseGroup")
  }
  return ctx
}

interface CollapseGroupProps {
  defaultOpenId?: string
  onOpenChange?: (state: Record<string, boolean>) => void
  children: React.ReactNode
}

export const CollapseCssGroup: FC<CollapseGroupProps> = ({
  children,
  defaultOpenId,
  onOpenChange,
}) => {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>(() => {
    return defaultOpenId ? { [defaultOpenId]: true } : {}
  })

  const setOpenState = React.useCallback(
    (id: string, open: boolean) => {
      setOpenStates((prev) => {
        const newState = { ...prev, [id]: open }
        onOpenChange?.(newState)
        return newState
      })
    },
    [onOpenChange],
  )

  const ctxValue = React.useMemo<CollapseContextValue>(
    () => ({
      openStates,
      setOpenState,
    }),
    [openStates, setOpenState],
  )

  return <CollapseContext value={ctxValue}>{children}</CollapseContext>
}

interface CollapseProps {
  title: React.ReactNode
  hideArrow?: boolean
  defaultOpen?: boolean
  isOpened?: boolean // For controlled usage
  collapseId?: string
  onOpenChange?: (isOpened: boolean) => void
  contentClassName?: string
  className?: string
  children: React.ReactNode
  innerClassName?: string
  ref?: React.Ref<CollapseCssRef>
}

export interface CollapseCssRef {
  setIsOpened: (isOpened: boolean) => void
}
export const CollapseCss: FC<CollapseProps> = ({
  title,
  hideArrow,
  defaultOpen = false,
  isOpened: controlledIsOpened,
  collapseId,
  onOpenChange,
  contentClassName,
  className,
  innerClassName,
  children,
  ref,
}) => {
  const reactId = React.useId()
  const id = collapseId ?? reactId
  const { openStates, setOpenState } = useCollapseContext()

  // Use controlled value if provided, otherwise use context state or defaultOpen
  const isOpened = controlledIsOpened ?? openStates[id] ?? defaultOpen

  const handleToggle = React.useCallback(() => {
    const newOpened = !isOpened
    // Only update context state if not controlled
    if (controlledIsOpened === undefined) {
      setOpenState(id, newOpened)
    }
    onOpenChange?.(newOpened)
  }, [id, isOpened, controlledIsOpened, setOpenState, onOpenChange])

  React.useImperativeHandle(ref, () => ({
    setIsOpened: (isOpened: boolean) => {
      setOpenState(id, isOpened)
    },
  }))
  return (
    <div className={cn("flex flex-col", className)} data-state={isOpened ? "open" : "hidden"}>
      <div
        className="relative flex w-full cursor-pointer items-center justify-between"
        onClick={controlledIsOpened === undefined ? handleToggle : undefined}
      >
        <span className="w-0 shrink grow truncate">{title}</span>
        {!hideArrow && (
          <div className="text-text-secondary inline-flex shrink-0 items-center">
            <i
              className={cn(
                "i-mingcute-down-line transition-transform duration-300 ease-in-out",
                isOpened ? "rotate-180" : "",
              )}
            />
          </div>
        )}
      </div>
      <CollapseCssContent
        isOpened={isOpened}
        className={contentClassName}
        innerClassName={innerClassName}
      >
        {children}
      </CollapseCssContent>
    </div>
  )
}

interface CollapseContentProps {
  isOpened: boolean
  className?: string
  children: React.ReactNode
  innerClassName?: string
}

const CollapseCssContent: FC<CollapseContentProps> = ({
  isOpened,
  className,
  children,
  innerClassName,
}) => {
  const contentRef = React.useRef<HTMLDivElement>(null)

  return (
    <div
      ref={contentRef}
      className={cn(
        "overflow-hidden [interpolate-size:allow-keywords] [transition-behavior:allow-discrete]",
        "transition-[height,opacity,display] duration-300 ease-in-out",
        "[@starting-style]:h-0 [@starting-style]:opacity-0",
        className,
        isOpened ? "block h-[calc-size(auto)] opacity-100" : "hidden h-0 opacity-0",
      )}
      data-state={isOpened ? "open" : "closed"}
    >
      <div
        className={cn(
          "transition-transform duration-300 ease-in-out",
          "[@starting-style]:translate-y-[-8px]",
          isOpened ? "translate-y-0" : "translate-y-[-8px]",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
