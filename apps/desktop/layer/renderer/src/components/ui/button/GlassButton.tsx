import { Spring } from "@follow/components/constants/spring.js"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils/utils"
import { cva } from "class-variance-authority"
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
   * Size variant
   */
  size?: "sm" | "md" | "lg"
  /**
   * Variant for different color schemes
   */
  variant?: "light" | "dark" | "auto"
}

const glassButtonVariants = cva(
  [
    // Base styles with modern glass morphism - perfect 1:1 circle
    "pointer-events-auto relative flex items-center justify-center rounded-full",
    "backdrop-blur-md border shadow-lg transition-all duration-300 ease-out",
  ],
  {
    variants: {
      size: {
        sm: "size-8 text-sm",
        md: "size-10 text-lg",
        lg: "size-12 text-xl",
      },
      variant: {
        light: [
          "bg-white/40 hover:bg-white/60",
          "text-gray-700 hover:text-gray-900",
          "border-gray-400/30 hover:border-gray-500/40",
          "shadow-gray-400/30",
        ],
        dark: [
          "bg-black/20 hover:bg-black/40",
          "text-white",
          "border-white/10 hover:border-white/20",
          "shadow-black/25",
        ],
        auto: [
          "bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/40",
          "text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-white",
          "border-gray-400/30 hover:border-gray-500/40 dark:border-white/10 dark:hover:border-white/20",
          "shadow-gray-400/30 dark:shadow-black/25",
        ],
      },
    },
    defaultVariants: {
      size: "md",
      variant: "auto",
    },
  },
)

const glassOverlayVariants = cva(
  "absolute inset-0 rounded-full bg-gradient-to-t opacity-0 transition-opacity duration-300 hover:opacity-100",
  {
    variants: {
      variant: {
        light: "from-white/10 to-white/30",
        dark: "from-white/5 to-white/20",
        auto: "from-white/10 to-white/30 dark:from-white/5 dark:to-white/20",
      },
    },
    defaultVariants: {
      variant: "auto",
    },
  },
)

const glassInnerShadowVariants = cva("absolute inset-0 rounded-full shadow-inner", {
  variants: {
    variant: {
      light: "shadow-gray-300/20",
      dark: "shadow-black/10",
      auto: "shadow-gray-300/20 dark:shadow-black/10",
    },
  },
  defaultVariants: {
    variant: "auto",
  },
})

export const GlassButton: FC<GlassButtonProps> = ({
  description,
  onClick,
  className,
  children,
  hoverScale = 1.1,
  tapScale = 0.95,
  size = "md",
  variant = "auto",
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <m.button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClick()
          }}
          className={cn(glassButtonVariants({ size, variant }), className)}
          initial={{ scale: 1 }}
          whileHover={{
            scale: hoverScale,
          }}
          whileTap={{ scale: tapScale }}
          transition={Spring.presets.snappy}
        >
          {/* Glass effect overlay */}
          <div className={glassOverlayVariants({ variant })} />

          {/* Icon container */}
          <div className="center relative z-10 flex">{children}</div>

          {/* Subtle inner shadow for depth */}
          <div className={glassInnerShadowVariants({ variant })} />
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
