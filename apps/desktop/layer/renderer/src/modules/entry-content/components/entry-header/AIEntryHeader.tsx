import { memo, useLayoutEffect, useRef, useState } from "react"

import { useEntryContentScrollToTop } from "../../atoms"
import { EntryHeaderRoot } from "./internal/context"
import { EntryHeaderActionsContainer } from "./internal/EntryHeaderActionsContainer"
import { EntryHeaderBreadcrumb } from "./internal/EntryHeaderBreadcrumb"
import type { EntryHeaderProps } from "./types"

function EntryHeaderImpl({ entryId, className, compact }: EntryHeaderProps) {
  const isAtTop = useEntryContentScrollToTop()
  const headerRef = useRef<HTMLDivElement>(null)
  const [isSmallWidth, setIsSmallWidth] = useState(false)
  useLayoutEffect(() => {
    const $header = headerRef.current
    if (!$header) return
    const handler = () => setIsSmallWidth($header.clientWidth <= 500)

    const observer = new ResizeObserver(handler)
    observer.observe($header)
    handler()

    return () => {
      observer.disconnect()
    }
  }, [headerRef])
  return (
    <EntryHeaderRoot entryId={entryId} className={className} compact={compact}>
      <nav
        className="group/header relative z-10 flex h-top-header w-full items-center justify-between gap-3 bg-background px-4 @container"
        data-at-top={isAtTop}
        data-hide-in-print
        ref={headerRef}
      >
        <EntryHeaderBreadcrumb />
        <EntryHeaderActionsContainer isSmallWidth={isSmallWidth} />
      </nav>
    </EntryHeaderRoot>
  )
}

export const AIEntryHeader = memo(EntryHeaderImpl)
