import { cn } from "@follow/utils/utils"
import type { Variants } from "framer-motion"
import { AnimatePresence, m } from "framer-motion"
import * as React from "react"

import {
  CollapseGroupItemStateProvider,
  CollapseStateProvider,
  useCurrentCollapseId,
  useSetCollapseGroupItemState,
  useSetCurrentCollapseId,
} from "./hooks"

interface CollapseProps {
  title: React.ReactNode
  hideArrow?: boolean
}

export const CollapseGroup: Component = ({ children }) => (
  <CollapseStateProvider>
    <CollapseGroupItemStateProvider>{children}</CollapseGroupItemStateProvider>
  </CollapseStateProvider>
)
export const Collapse: Component<CollapseProps> = (props) => {
  const [isOpened, setIsOpened] = React.useState(false)
  const id = React.useId()
  const setCurrentId = useSetCurrentCollapseId()
  const currentId = useCurrentCollapseId()
  const setItemStatus = useSetCollapseGroupItemState()
  React.useEffect(() => {
    if (isOpened) {
      setCurrentId(id)
    }
    setItemStatus((prev) => ({ ...prev, [id]: isOpened }))
  }, [id, isOpened, setCurrentId, setItemStatus])
  React.useEffect(() => {
    setIsOpened(currentId === id)
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
    <CollapseContent isOpened={props.isOpened}>{props.children}</CollapseContent>
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
