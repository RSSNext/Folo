import { cn } from "@follow/utils/utils"
import { atom, useStore } from "jotai"
import type { Variants } from "motion/react"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"
import * as React from "react"
import { useEffect } from "react"

import type { CollapseContextValue } from "./hooks"
import { CollaspeContext } from "./hooks"

interface CollapseProps {
  title: React.ReactNode
  hideArrow?: boolean
  defaultOpen?: boolean
  collapseId?: string
  onOpenChange?: (isOpened: boolean) => void
  contentClassName?: string
}

/**
 * @deprecated Use CollapseCssGroup instead
 */
export const CollapseGroup: FC<
  {
    defaultOpenId?: string
    onOpenChange?: (state: Record<string, boolean>) => void
  } & React.PropsWithChildren
> = ({ children, defaultOpenId, onOpenChange }) => {
  const ctxValue = React.useMemo<CollapseContextValue>(
    () => ({
      currentOpenCollapseIdAtom: atom<string | null>(defaultOpenId ?? null),
      collapseGroupItemStateAtom: atom<Record<string, boolean>>({}),
    }),
    [defaultOpenId],
  )

  const store = useStore()
  useEffect(() => {
    return store.sub(ctxValue.collapseGroupItemStateAtom, () => {
      const state = store.get(ctxValue.collapseGroupItemStateAtom)

      onOpenChange?.(state)
    })
  }, [defaultOpenId])
  return <CollaspeContext value={ctxValue}>{children}</CollaspeContext>
}

/**
 * @deprecated Use CollapseCss instead
 */

export const CollapseControlled: Component<
  {
    isOpened: boolean
    onOpenChange: (v: boolean) => void
  } & CollapseProps
> = (props) => (
  <div
    className={cn("flex flex-col", props.className)}
    data-state={props.isOpened ? "open" : "hidden"}
  >
    <div
      className="relative flex w-full cursor-pointer items-center justify-between"
      onClick={() => props.onOpenChange(!props.isOpened)}
    >
      <span className="w-0 shrink grow truncate">{props.title}</span>
      {!props.hideArrow && (
        <div className="inline-flex shrink-0 items-center text-gray-400">
          <i
            className={cn("i-mingcute-down-line duration-200", props.isOpened ? "rotate-180" : "")}
          />
        </div>
      )}
    </div>
    <CollapseContent isOpened={props.isOpened} className={props.contentClassName}>
      {props.children}
    </CollapseContent>
  </div>
)

/**
 * @deprecated Use CollapseCssContent instead
 */
export const CollapseContent: Component<{
  isOpened: boolean
  withBackground?: boolean
}> = ({ isOpened, className, children }) => {
  const variants = React.useMemo(() => {
    const v = {
      open: {
        opacity: 1,
        height: "auto",

        transition: {
          type: "spring",
          mass: 0.2,
        },
      },
      collapsed: {
        opacity: 0,
        height: 0,
        overflow: "hidden",
      },
    } satisfies Variants

    return v
  }, [])
  return (
    <AnimatePresence initial={false}>
      {isOpened && (
        <m.div
          key="content"
          initial="collapsed"
          animate="open"
          exit="collapsed"
          variants={variants}
          className={className}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  )
}
