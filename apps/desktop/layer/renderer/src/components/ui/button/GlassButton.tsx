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
        dark: ["text-white hover:text-white"],
        auto: ["text-text hover:text-text-vibrant"],
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
          "bg-material-thin hover:bg-material-medium",
          "border-gray/30 hover:border-gray/40",
          "shadow-gray/30",
        ],
      },
      {
        variant: "glass",
        theme: "dark",
        className: [
          "bg-material-ultra-thin hover:bg-material-thin",
          "border-gray/10 hover:border-gray/20",
          "shadow-black/25",
        ],
      },
      {
        variant: "glass",
        theme: "auto",
        className: [
          "bg-material-thin hover:bg-material-medium",
          "border-gray/30 hover:border-gray/40",
          "shadow-gray/30",
        ],
      },
      // Flat variant themes
      {
        variant: "flat",
        theme: "light",
        className: ["bg-white/80 hover:bg-white/90", "border-gray/20 hover:border-gray/30"],
      },
      {
        variant: "flat",
        theme: "dark",
        className: [
          "bg-fill-secondary hover:bg-fill-tertiary",
          "border-gray/20 hover:border-gray/30",
        ],
      },
      {
        variant: "flat",
        theme: "auto",
        className: [
          "bg-white/80 hover:bg-white/90 dark:bg-fill-secondary dark:hover:bg-fill-tertiary",
          "border-gray/20 hover:border-gray/30",
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
        light: "from-material-opaque/10 to-material-opaque/30",
        dark: "from-material-opaque/5 to-material-opaque/20",
        auto: "from-material-opaque/10 to-material-opaque/30",
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
      light: "shadow-gray/20",
      dark: "shadow-black/10",
      auto: "shadow-gray/20 dark:shadow-black/10",
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
