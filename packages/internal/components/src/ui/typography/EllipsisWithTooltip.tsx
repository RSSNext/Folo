import { cn } from "@follow/utils/utils"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"

import { Tooltip, TooltipContent, TooltipPortal, TooltipTrigger } from "../tooltip"

const isTextOverflowed = (element: HTMLElement, dir: "h" | "v") => {
  if (dir === "h") {
    return element.offsetWidth < element.scrollWidth
  } else {
    return element.offsetHeight < element.scrollHeight
  }
}
type EllipsisProps = PropsWithChildren<{
  width?: string
  className?: string
  disabled?: boolean
  dir?: "h" | "v"
}>

export const EllipsisTextWithTooltip = (props: EllipsisProps) => {
  const { children, className, width, disabled, dir = "v" } = props

  const [textElRef, setTextElRef] = useState<HTMLSpanElement | null>()
  const [isOverflowed, setIsOverflowed] = useState(false)

  const judgment = () => {
    if (!textElRef) return

    setIsOverflowed(isTextOverflowed(textElRef, dir))
  }
  useEffect(() => {
    judgment()
  }, [textElRef, children])

  useEffect(() => {
    if (!textElRef) return
    const resizeObserver = new ResizeObserver(() => {
      judgment()
    })
    resizeObserver.observe(textElRef)

    return () => {
      resizeObserver.disconnect()
    }
  }, [textElRef])

  const Content = (
    <span
      className={className}
      ref={setTextElRef}
      style={
        width
          ? {
              maxWidth: width,
            }
          : undefined
      }
    >
      {children}
    </span>
  )

  if (!isOverflowed || disabled) return Content
  return (
    <Tooltip>
      <TooltipTrigger asChild>{Content}</TooltipTrigger>

      <TooltipPortal>
        <TooltipContent>
          <span className="whitespace-pre-line break-all" onClick={(e) => e.stopPropagation()}>
            {children}
          </span>
        </TooltipContent>
      </TooltipPortal>
    </Tooltip>
  )
}

/**
 * Show ellipses when horizontal text overflows and full text on hover.
 */
export const EllipsisHorizontalTextWithTooltip = (props: EllipsisProps) => {
  const { className, ...rest } = props
  return <EllipsisTextWithTooltip className={cn("block truncate", className)} {...rest} dir="h" />
}
