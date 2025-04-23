import { cn } from "@follow/utils/utils"
import type { Spring } from "motion/react"
import { m } from "motion/react"
import { useEffect, useRef, useState } from "react"

const softSpringPreset: Spring = {
  type: "spring",
}

interface AnimateChangeInHeightProps {
  children: React.ReactNode
  className?: string
  duration?: number

  spring?: boolean
  innerClassName?: string
}

export const AutoResizeHeight: React.FC<AnimateChangeInHeightProps> = ({
  children,
  className,
  duration = 0.35,
  spring = false,
  innerClassName,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [height, setHeight] = useState<number | "auto">("auto")

  useEffect(() => {
    if (!containerRef.current) return
    const resizeObserver = new ResizeObserver((entries) => {
      // We only have one entry, so we can use entries[0].
      const target = entries[0]!.target as HTMLElement
      const observedHeight = entries[0]!.contentRect.height
      const style = getComputedStyle(target)

      const marginHeight =
        Number.parseFloat(style.marginTop) + Number.parseFloat(style.marginBottom)
      // add margin top
      setHeight(observedHeight + marginHeight)
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      // Cleanup the observer when the component is unmounted
      resizeObserver.disconnect()
    }
  }, [])

  return (
    <m.div
      className={cn("overflow-hidden", className)}
      initial={false}
      animate={{ height }}
      transition={
        spring
          ? {
              ...softSpringPreset,
              duration,
            }
          : {
              duration,
            }
      }
    >
      <div className={cn("overflow-hidden", innerClassName)} ref={containerRef}>
        {children}
      </div>
    </m.div>
  )
}
