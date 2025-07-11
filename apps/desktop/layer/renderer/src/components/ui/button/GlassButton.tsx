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
   * Color theme
   */
  theme?: "light" | "dark" | "auto"
  /**
   * Visual variant
   */
  variant?: "glass" | "flat"
}

const glassButtonVariants = cva(
  [
    // Base styles - perfect 1:1 circle
    "pointer-events-auto relative flex items-center justify-center rounded-full",
    "transition-all duration-300 ease-out",
  ],
  {
    variants: {
      size: {
        sm: "size-8 text-sm",
        md: "size-10 text-lg",
        lg: "size-12 text-xl",
      },
      theme: {
        light: ["text-gray-700 hover:text-gray-900"],
        dark: ["text-white"],
        auto: ["text-gray-700 hover:text-gray-900 dark:text-white dark:hover:text-white"],
      },
      variant: {
        glass: ["backdrop-blur-md border shadow-lg"],
        flat: ["border shadow-none"],
      },
    },
    compoundVariants: [
      // Glass variant themes
      {
        variant: "glass",
        theme: "light",
        className: [
          "bg-white/40 hover:bg-white/60",
          "border-gray-400/30 hover:border-gray-500/40",
          "shadow-gray-400/30",
        ],
      },
      {
        variant: "glass",
        theme: "dark",
        className: [
          "bg-black/20 hover:bg-black/40",
          "border-white/10 hover:border-white/20",
          "shadow-black/25",
        ],
      },
      {
        variant: "glass",
        theme: "auto",
        className: [
          "bg-white/40 hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/40",
          "border-gray-400/30 hover:border-gray-500/40 dark:border-white/10 dark:hover:border-white/20",
          "shadow-gray-400/30 dark:shadow-black/25",
        ],
      },
      // Flat variant themes
      {
        variant: "flat",
        theme: "light",
        className: ["bg-gray-100 hover:bg-gray-200", "border-gray-300 hover:border-gray-400"],
      },
      {
        variant: "flat",
        theme: "dark",
        className: ["bg-gray-800 hover:bg-gray-700", "border-gray-700 hover:border-gray-600"],
      },
      {
        variant: "flat",
        theme: "auto",
        className: [
          "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700",
          "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600",
        ],
      },
    ],
    defaultVariants: {
      size: "md",
      theme: "auto",
      variant: "glass",
    },
  },
)

const glassOverlayVariants = cva(
  "absolute inset-0 rounded-full bg-gradient-to-t opacity-0 transition-opacity duration-300 hover:opacity-100",
  {
    variants: {
      theme: {
        light: "from-white/10 to-white/30",
        dark: "from-white/5 to-white/20",
        auto: "from-white/10 to-white/30 dark:from-white/5 dark:to-white/20",
      },
    },
    defaultVariants: {
      theme: "auto",
    },
  },
)

const glassInnerShadowVariants = cva("absolute inset-0 rounded-full shadow-inner", {
  variants: {
    theme: {
      light: "shadow-gray-300/20",
      dark: "shadow-black/10",
      auto: "shadow-gray-300/20 dark:shadow-black/10",
    },
  },
  defaultVariants: {
    theme: "auto",
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
  theme = "auto",
  variant = "glass",
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
          className={cn(glassButtonVariants({ size, theme, variant }), className)}
          initial={{ scale: 1 }}
          whileHover={
            variant === "flat"
              ? undefined
              : {
                  scale: hoverScale,
                }
          }
          whileTap={{ scale: tapScale }}
          transition={Spring.presets.snappy}
        >
          {/* Glass effect overlay - only for glass variant */}
          {variant === "glass" && <div className={glassOverlayVariants({ theme })} />}

          {/* Icon container */}
          <div className="center relative z-10 flex">{children}</div>

          {/* Subtle inner shadow for depth - only for glass variant */}
          {variant === "glass" && <div className={glassInnerShadowVariants({ theme })} />}
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
