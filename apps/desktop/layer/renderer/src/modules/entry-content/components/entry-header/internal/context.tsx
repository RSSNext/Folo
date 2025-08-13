import { useHasEntry } from "@follow/store/entry/hooks"
import { cn } from "@follow/utils/utils"
import type { ReactNode } from "react"
import { createContext, memo, use, useMemo } from "react"

import { useEntryContentScrollToTop, useEntryTitleMeta } from "../../../atoms"
import type { EntryHeaderProps } from "../types"

interface EntryHeaderContextValue {
  entryId: string
  compact?: boolean
}

const EntryHeaderContext = createContext<EntryHeaderContextValue | null>(null)

export function useEntryHeaderContext() {
  const ctx = use(EntryHeaderContext)
  if (!ctx) throw new Error("EntryHeader components must be used within <EntryHeaderRoot />")
  return ctx
}

export interface EntryHeaderRootProps extends EntryHeaderProps {
  children: ReactNode
}

function EntryHeaderRootImpl({ entryId, className, compact, children }: EntryHeaderRootProps) {
  const hasEntry = useHasEntry(entryId)
  const entryTitleMeta = useEntryTitleMeta()
  const isAtTop = !!useEntryContentScrollToTop()

  const shouldShowMeta = !isAtTop && !!entryTitleMeta?.entryTitle

  const contextValue = useMemo(() => ({ entryId, compact }), [entryId, compact])
  if (!hasEntry) return null

  return (
    <EntryHeaderContext value={contextValue}>
      <div
        data-hide-in-print
        className={cn(
          "zen-mode-macos:ml-margin-macos-traffic-light-x text-text-secondary relative flex min-w-0 items-center justify-between gap-3 overflow-hidden text-lg duration-200",
          shouldShowMeta && "border-border border-b",
          className,
        )}
      >
        {children}
      </div>
    </EntryHeaderContext>
  )
}

export const EntryHeaderRoot = memo(EntryHeaderRootImpl)
