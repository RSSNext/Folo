import { useHasEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils/utils"
import type { MotionStyle } from "motion/react"
import type { ReactNode } from "react"
import { createContext, memo, use, useMemo } from "react"

import { m } from "~/components/common/Motion"

import { useEntryContentScrollToTop, useEntryTitleMeta } from "../../../atoms"
import type { EntryHeaderProps } from "../types"

interface EntryHeaderContextValue {
  entryId: string
}

const EntryHeaderContext = createContext<EntryHeaderContextValue | null>(null)

export function useEntryHeaderContext() {
  const ctx = use(EntryHeaderContext)
  if (!ctx) throw new Error("EntryHeader components must be used within <EntryHeaderRoot />")
  return ctx
}

export interface EntryHeaderRootProps extends EntryHeaderProps {
  children: ReactNode
  style?: MotionStyle
}

function EntryHeaderRootImpl({
  entryId,
  className,
  compact,
  children,
  style,
}: EntryHeaderRootProps) {
  const hasEntry = useHasEntry(entryId)
  const entryTitleMeta = useEntryTitleMeta()
  const isAtTop = !!useEntryContentScrollToTop()

  const shouldShowMeta = !isAtTop && !!entryTitleMeta?.entryTitle

  const contextValue = useMemo(() => ({ entryId, compact }), [entryId, compact])
  if (!hasEntry) return null

  return (
    <EntryHeaderContext value={contextValue}>
      <m.div
        data-hide-in-print
        className={cn(
          "relative flex min-w-0 items-center justify-between gap-3 overflow-hidden border-b border-transparent text-lg text-text-secondary duration-200 macos-left-column-hidden:pl-margin-macos-traffic-light-x",
          shouldShowMeta && "border-border",
          className,
        )}
        style={style}
      >
        {children}
      </m.div>
    </EntryHeaderContext>
  )
}

export const EntryHeaderRoot = memo(EntryHeaderRootImpl)
