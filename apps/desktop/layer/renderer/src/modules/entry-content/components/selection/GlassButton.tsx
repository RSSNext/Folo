import { cn } from "@follow/utils"
import type { HTMLMotionProps } from "motion/react"
import { m } from "motion/react"

interface GlassButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary"
  isLoading?: boolean
  ref?: React.Ref<HTMLButtonElement>
}

export const GlassButton = ({
  className,
  variant = "primary",
  isLoading,
  children,
  disabled,
  ref,
  ...props
}: GlassButtonProps) => {
  const isPrimary = variant === "primary"

  return (
    <m.button
      ref={ref}
      type="button"
      disabled={disabled || isLoading}
      className={cn(
        "relative flex items-center gap-2 overflow-hidden rounded-full border px-4 py-1.5 text-sm font-semibold backdrop-blur-md",
        "transition-all duration-300",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isPrimary
          ? "border-accent/30 text-white"
          : "border-text/10 bg-fill/5 text-text hover:bg-fill/10",
        className,
      )}
      style={
        isPrimary
          ? {
              background: "linear-gradient(135deg, hsl(var(--fo-a) / 0.9), hsl(var(--fo-a) / 0.8))",
              boxShadow:
                "0 4px 16px hsl(var(--fo-a) / 0.2), 0 2px 8px hsl(var(--fo-a) / 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
            }
          : undefined
      }
      whileHover={
        !disabled && !isLoading
          ? {
              scale: 1.05,
              boxShadow: isPrimary
                ? "0 6px 24px hsl(var(--fo-a) / 0.3), 0 4px 12px hsl(var(--fo-a) / 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.3)"
                : "0 4px 12px rgba(0,0,0,0.05)",
            }
          : undefined
      }
      whileTap={!disabled && !isLoading ? { scale: 0.95 } : undefined}
      {...props}
    >
      {/* Hover shine effect for primary */}
      {isPrimary && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 hover:translate-x-full" />
      )}
      {children as React.ReactNode}
    </m.button>
  )
}

GlassButton.displayName = "GlassButton"
