import { useMeasure } from "@follow/hooks"
import { cn } from "@follow/utils/utils"
import * as React from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip"

export const PanelSplitter = (
  props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
    isDragging?: boolean
    cursor?: string

    tooltip?: React.ReactNode
  },
) => {
  const { isDragging, cursor, tooltip, ...rest } = props

  React.useEffect(() => {
    if (!isDragging) return
    const $css = document.createElement("style")

    $css.innerHTML = `
      * {
        cursor: ${cursor} !important;
      }
    `

    document.head.append($css)
    return () => {
      $css.remove()
    }
  }, [cursor, isDragging])
  const [ref, { height }] = useMeasure()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div ref={ref} className="relative h-full w-0 shrink-0" data-hide-in-print>
          <div
            tabIndex={-1}
            {...rest}
            className={cn(
              "active:!bg-accent absolute inset-0 z-[3] w-[2px] -translate-x-1/2 cursor-ew-resize bg-transparent hover:bg-gray-400 hover:dark:bg-neutral-500",
              isDragging ? "bg-accent" : "",
            )}
          />
        </div>
      </TooltipTrigger>
      <TooltipContent sideOffset={-height / 2}>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
