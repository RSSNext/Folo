import { Spring } from "@follow/components/constants/spring.js"
import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import type { ReactNode } from "react"

export interface AIShortcutButtonProps {
  /** The text content of the button */
  children: ReactNode
  /** Click handler for the button */
  onClick: () => void
  /** Additional CSS classes */
  className?: string
  /** Animation delay for staggered animations */
  animationDelay?: number
  /** Whether the button should show a tooltip */
  title?: string
  /** Button size variant */
  size?: "sm" | "md"
  /** Button style variant */
  variant?: "default" | "outline"
  /** Whether the button is disabled */
  disabled?: boolean
}

/**
 * Reusable AI shortcut button component used throughout the AI chat interface.
 * Provides consistent styling, animations, and interaction patterns for AI shortcuts.
 */
export const AIShortcutButton: React.FC<AIShortcutButtonProps> = ({
  children,
  onClick,
  className,
  animationDelay = 0,
  title,
  size = "md",
  variant = "default",
  disabled = false,
}) => {
  return (
    <m.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ delay: animationDelay, ...Spring.presets.snappy }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        // Base styles
        "inline-flex items-center gap-2 rounded-full font-medium transition-all",
        "hover:shadow-sm active:scale-95",

        // Size variants
        size === "sm" && "px-2.5 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",

        // Style variants
        variant === "default" && [
          "bg-material-medium hover:bg-material-thick",
          "border-border/50 hover:border-border border",
          "text-text hover:text-text",
        ],
        variant === "outline" && [
          "border border-purple-200/30 dark:border-purple-800/30",
          "bg-white/10 hover:bg-white/20 dark:hover:bg-neutral-800/30",
          "text-purple-600 dark:text-purple-400",
          "backdrop-blur-sm",
        ],

        // Disabled state
        disabled && "cursor-not-allowed opacity-50",

        // Default to nowrap for better layout
        "whitespace-nowrap",

        className,
      )}
    >
      {children}
    </m.button>
  )
}
