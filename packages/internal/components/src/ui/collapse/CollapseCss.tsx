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
  collapseId?: string
  onOpenChange?: (isOpened: boolean) => void
  contentClassName?: string
  className?: string
  children: React.ReactNode
}

export const CollapseCss: FC<CollapseProps> = ({
  title,
  hideArrow,
  defaultOpen = false,
  collapseId,
  onOpenChange,
  contentClassName,
  className,
  children,
}) => {
  const reactId = React.useId()
  const id = collapseId ?? reactId
  const { openStates, setOpenState } = useCollapseContext()

  const isOpened = openStates[id] ?? defaultOpen

  const handleToggle = React.useCallback(() => {
    const newOpened = !isOpened
    setOpenState(id, newOpened)
    onOpenChange?.(newOpened)
  }, [id, isOpened, setOpenState, onOpenChange])

  return (
    <div className={cn("flex flex-col", className)} data-state={isOpened ? "open" : "hidden"}>
      <div
        className="relative flex w-full cursor-pointer items-center justify-between"
        onClick={handleToggle}
      >
        <span className="w-0 shrink grow truncate">{title}</span>
        {!hideArrow && (
          <div className="inline-flex shrink-0 items-center text-gray-400">
            <i
              className={cn(
                "i-mingcute-down-line transition-transform duration-300 ease-in-out",
                isOpened ? "rotate-180" : "",
              )}
            />
          </div>
        )}
      </div>
      <CollapseCssContent isOpened={isOpened} className={contentClassName}>
        {children}
      </CollapseCssContent>
    </div>
  )
}

interface CollapseContentProps {
  isOpened: boolean
  className?: string
  children: React.ReactNode
}

const CollapseCssContent: FC<CollapseContentProps> = ({ isOpened, className, children }) => {
  const contentRef = React.useRef<HTMLDivElement>(null)

  return (
    <div
      ref={contentRef}
      className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out [interpolate-size:allow-keywords]",
        isOpened ? "h-[calc-size(auto)] opacity-100" : "h-0 opacity-0",

        className,
      )}
      data-state={isOpened ? "open" : "closed"}
    >
      <div
        className={tw`transition-transform duration-300 ease-in-out ${isOpened ? "translateY(0)" : "translateY(-8px)"}`}
      >
        {children}
      </div>
    </div>
  )
}
