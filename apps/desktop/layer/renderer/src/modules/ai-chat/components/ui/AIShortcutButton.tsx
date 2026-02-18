import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils/utils"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import type { HTMLMotionProps } from "motion/react"
import { m } from "motion/react"

const aiShortcutButtonVariants = cva(
  [
    // Base styles
    "inline-flex items-center gap-2 rounded-full font-medium",
    "hover:shadow-sm whitespace-nowrap",
    "backdrop-blur-background",
  ],
  {
    variants: {
      size: {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
      },
      variant: {
        default: [
          "hover:bg-material-thick bg-material-ultra-thick",
          "border-border/50 hover:border-border border",
          "text-text hover:text-text",
        ],
      },
      disabled: {
        true: "cursor-not-allowed opacity-50",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
      disabled: false,
    },
  },
)

export interface AIShortcutButtonProps extends VariantProps<typeof aiShortcutButtonVariants> {
  animationDelay?: number
}

export const AIShortcutButton = ({
  children,
  onClick,
  className,
  animationDelay = 0,
  size,
  variant,
  disabled,
  style,
  ref,
  ...rest
}: AIShortcutButtonProps & HTMLMotionProps<"button">) => {
  return (
    <m.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ delay: animationDelay, ...Spring.presets.snappy }}
      onClick={onClick}
      disabled={disabled ?? false}
      className={cn(aiShortcutButtonVariants({ size, variant, disabled }), className)}
      ref={ref}
      {...rest}
    >
      {children}
    </m.button>
  )
}

AIShortcutButton.displayName = "AIShortcutButton"
