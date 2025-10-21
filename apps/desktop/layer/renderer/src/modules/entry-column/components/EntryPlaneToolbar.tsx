import { ActionButton } from "@follow/components/ui/button/index.js"
import { cn, stopPropagation } from "@follow/utils"
import type { FC, SVGProps } from "react"

import { setSubscriptionEntryPlaneVisible, useSubscriptionEntryPlaneVisible } from "~/atoms/sidebar"

interface EntryPlaneToolbarProps {
  className?: string
}

export const EntryPlaneToolbar: FC<EntryPlaneToolbarProps> = ({ className }) => {
  const isVisible = useSubscriptionEntryPlaneVisible()

  const handleToggle = () => {
    setSubscriptionEntryPlaneVisible(!isVisible)
  }

  // When hidden, show only a compact toggle button
  if (!isVisible) {
    return (
      <div className={cn("translate-y-2 p-2", className)} onClick={stopPropagation}>
        <ActionButton tooltip="Show Entry List" size="sm" onClick={handleToggle}>
          <MaterialSymbolsExpandContent />
        </ActionButton>
      </div>
    )
  }

  // When visible, show full toolbar
  return (
    <div
      onClick={stopPropagation}
      className={cn(
        "flex h-11 items-center justify-between px-2 text-xl text-text-secondary",
        "shrink-0 backdrop-blur-background",
        className,
      )}
    >
      <div className="flex items-center gap-2 whitespace-pre">
        <div className="text-sm font-medium">Entry List</div>
      </div>

      <ActionButton tooltip="Hide Entry List" size="sm" onClick={handleToggle}>
        <MaterialSymbolsCollapseContentRounded />
      </ActionButton>
    </div>
  )
}

function MaterialSymbolsCollapseContentRounded(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      {/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}
      <path
        fill="currentColor"
        d="M9 15H6q-.425 0-.712-.288T5 14t.288-.712T6 13h4q.425 0 .713.288T11 14v4q0 .425-.288.713T10 19t-.712-.288T9 18zm6-6h3q.425 0 .713.288T19 10t-.288.713T18 11h-4q-.425 0-.712-.288T13 10V6q0-.425.288-.712T14 5t.713.288T15 6z"
      />
    </svg>
  )
}

export function MaterialSymbolsExpandContent(props: SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
      {/* Icon from Material Symbols by Google - https://github.com/google/material-design-icons/blob/master/LICENSE */}
      <path fill="currentColor" d="M5 19v-6h2v4h4v2zm12-8V7h-4V5h6v6z" />
    </svg>
  )
}
