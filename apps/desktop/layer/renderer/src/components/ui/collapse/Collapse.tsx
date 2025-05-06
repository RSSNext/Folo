import { jotaiStore } from "@follow/utils/jotai"
import { cn } from "@follow/utils/utils"
import { atom, useAtom, useStore } from "jotai"
import type { Variants } from "motion/react"
import { AnimatePresence, m } from "motion/react"
import type { FC } from "react"
import * as React from "react"
import { useEffect } from "react"

import type { CollapseContextValue } from "./hooks"
import { CollaspeContext, useCollapseContext } from "./hooks"

interface CollapseProps {
  title: React.ReactNode
  hideArrow?: boolean
  defaultOpen?: boolean
  collapseId?: string
  onOpenChange?: (isOpened: boolean) => void
  contentClassName?: string
}

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

export const Collapse: Component<CollapseProps> = ({ onOpenChange, ...props }) => {
  const [isOpened, setIsOpened] = React.useState(props.defaultOpen ?? false)
  const reactId = React.useId()
  const id = props.collapseId ?? reactId
  const { currentOpenCollapseIdAtom, collapseGroupItemStateAtom } = useCollapseContext()
  const [currentId, setCurrentId] = useAtom(currentOpenCollapseIdAtom)

  React.useEffect(() => {
    if (isOpened) {
      setCurrentId(id)
    }
    const prevState = jotaiStore.get(collapseGroupItemStateAtom)
    jotaiStore.set(collapseGroupItemStateAtom, { ...prevState, [id]: isOpened })

    return () => {
      const prevState = jotaiStore.get(collapseGroupItemStateAtom)
      delete prevState[id]
      jotaiStore.set(collapseGroupItemStateAtom, prevState)
    }
  }, [collapseGroupItemStateAtom, id, isOpened, setCurrentId])
  React.useEffect(() => {
    const isOpened = currentId === id
    setIsOpened(isOpened)
    onOpenChange?.(isOpened)
  }, [currentId, id])
  return <CollapseControlled isOpened={isOpened} onOpenChange={setIsOpened} {...props} />
}

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
