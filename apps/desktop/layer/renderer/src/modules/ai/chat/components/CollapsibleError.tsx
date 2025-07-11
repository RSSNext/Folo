import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils"
import { m } from "motion/react"
import * as React from "react"

interface CollapsibleErrorProps {
  error: Error | string
  title?: string
  className?: string
  collapsedHeight?: string
  icon?: string
}

export const CollapsibleError: React.FC<CollapsibleErrorProps> = ({
  error,
  title = "Error occurred",
  className,
  collapsedHeight = "48px",
  icon = "i-mgc-alert-cute-fi",
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false)

  const errorMessage = typeof error === "string" ? error : error.message

  return (
    <div
      className={cn(
        "animate-in slide-in-from-bottom-2 fade-in-0 group mb-3 duration-300",
        className,
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <m.div
        initial={false}
        animate={{
          height: isExpanded ? "auto" : collapsedHeight,
        }}
        transition={Spring.presets.snappy}
        className="overflow-hidden"
      >
        <div
          className={cn(
            "bg-red/5 border-red/20 shadow-red/5 dark:shadow-red/10 relative overflow-hidden rounded-xl backdrop-blur-2xl transition-all duration-200",
            "group-hover:bg-red/10 group-hover:border-red/30",
          )}
        >
          {/* Glass effect overlay */}
          <div className="from-red/5 absolute inset-0 bg-gradient-to-r to-transparent" />

          {/* Collapsed Content */}
          <div className="relative z-10 flex items-center gap-3 p-3">
            <m.div
              animate={{
                rotate: isExpanded ? 0 : -90,
                scale: isExpanded ? 1 : 0.8,
              }}
              transition={{ duration: 0.2 }}
              className="bg-red/20 flex size-6 flex-shrink-0 items-center justify-center rounded-full"
            >
              <i className={cn(icon, "text-red size-3")} />
            </m.div>
            <div className="min-w-0 flex-1">
              <div className="text-red text-sm font-medium">{title}</div>
            </div>
            <m.span
              animate={{
                opacity: isExpanded ? 0 : 1,
                scale: isExpanded ? 0.8 : 1,
              }}
              transition={{ duration: 0.15 }}
              className="text-text-tertiary text-xs"
            >
              hover to expand
            </m.span>
          </div>

          {/* Expanded Content */}
          <m.div
            animate={{
              opacity: isExpanded ? 1 : 0,
              height: isExpanded ? "auto" : 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            className="overflow-hidden"
          >
            <div className="border-red/20 bg-red/5 border-t px-3 pb-3">
              <div className="text-red/80 bg-red/10 mt-2 rounded-md p-3 text-xs leading-relaxed">
                {errorMessage}
              </div>
            </div>
          </m.div>
        </div>
      </m.div>
    </div>
  )
}
