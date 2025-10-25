import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils/utils"
import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"
import { m } from "motion/react"
import type { ReactNode } from "react"

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
  children: ReactNode
  onClick: () => void
  className?: string
  animationDelay?: number
  title?: string
  style?: React.CSSProperties
  ref?: React.Ref<HTMLButtonElement>
}

export const AIShortcutButton: React.FC<AIShortcutButtonProps> = ({
  children,
  onClick,
  className,
  animationDelay = 0,
  title,
  size,
  variant,
  disabled,
  style,
  ref,
}) => {
  return (
    <m.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ delay: animationDelay, ...Spring.presets.snappy }}
      onClick={onClick}
      disabled={disabled ?? false}
      title={title}
      className={cn(aiShortcutButtonVariants({ size, variant, disabled }), className)}
      style={style}
      ref={ref}
    >
      {children}
    </m.button>
  )
}
