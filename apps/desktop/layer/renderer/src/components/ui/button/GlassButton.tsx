import { Spring } from "@follow/components/constants/spring.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import type { FC, ReactNode } from "react"

export interface GlassButtonProps {
  description?: string
  onClick: () => void
  className?: string
  children: ReactNode
  /**
   * Custom animation variants for hover and tap states
   */
  hoverScale?: number
  tapScale?: number
  /**
   * Custom colors for glass effect
   */
  backgroundColor?: string
  hoverBackgroundColor?: string
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg"
}

export const GlassButton: FC<GlassButtonProps> = ({
  description,
  onClick,
  className,
  children,
  hoverScale = 1.1,
  tapScale = 0.95,
  backgroundColor = "rgba(0, 0, 0, 0.2)",
  hoverBackgroundColor = "rgba(255, 255, 255, 0.15)",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "size-8 text-sm",
    md: "size-10 text-lg",
    lg: "size-12 text-xl",
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <m.button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className={cn(
            // Base styles with modern glass morphism - perfect 1:1 circle
            "pointer-events-auto relative flex items-center justify-center rounded-full",
            "text-white backdrop-blur-md",
            // Border and shadow for depth
            "border border-white/10 shadow-lg shadow-black/25",
            // Opacity and transition
            "transition-all duration-300 ease-out",
            // Size classes
            sizeClasses[size],
            className,
          )}
          style={{
            backgroundColor,
          }}
          initial={{ scale: 1 }}
          whileHover={{
            scale: hoverScale,
            backgroundColor: hoverBackgroundColor,
            borderColor: "rgba(255, 255, 255, 0.2)",
          }}
          whileTap={{ scale: tapScale }}
          transition={Spring.presets.snappy}
        >
          {/* Glass effect overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-white/5 to-white/20 opacity-0 transition-opacity duration-300 hover:opacity-100" />

          {/* Icon container */}
          <div className="center relative z-10 flex">{children}</div>

          {/* Subtle inner shadow for depth */}
          <div className="absolute inset-0 rounded-full shadow-inner shadow-black/10" />
        </m.button>
      </TooltipTrigger>
      {description && (
        <TooltipPortal>
          <TooltipContent>{description}</TooltipContent>
        </TooltipPortal>
      )}
    </Tooltip>
  )
}
