import { cn } from "@follow/utils/utils"
import { m } from "motion/react"
import type { ReactNode } from "react"

interface HeaderActionButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  variant?: "primary" | "accent" | "neutral"
  className?: string
  icon?: string
  iconClassName?: string
  "data-testid"?: string
}

export const HeaderActionButton = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = "neutral",
  className,
  icon,
  iconClassName,
  "data-testid": testId,
}: HeaderActionButtonProps) => {
  const getVariantStyles = () => {
    if (disabled) {
      return [
        "text-text-tertiary cursor-not-allowed opacity-50",
        "bg-fill-quaternary border border-transparent",
      ]
    }

    switch (variant) {
      case "primary": {
        return [
          "bg-blue/10 text-blue hover:bg-blue/20",
          "border border-blue/20 hover:border-blue/30",
          "active:bg-blue/30 active:scale-95",
        ]
      }
      case "accent": {
        return [
          "bg-accent/10 text-accent hover:bg-accent/20",
          "border border-accent/20 hover:border-accent/30",
          "active:bg-accent/30 active:scale-95",
        ]
      }
      default: {
        return [
          "bg-fill/10 text-text hover:bg-fill/20",
          "border border-fill/20 hover:border-fill/30",
          "active:bg-fill/30 active:scale-95",
        ]
      }
    }
  }

  const iconClass = loading ? "i-mgc-loading-3-cute-re animate-spin duration-500" : icon

  return (
    <m.button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "no-drag-region group relative flex items-center gap-2 rounded-lg px-3 py-2",
        "text-sm font-medium transition-all duration-200",
        ...getVariantStyles(),
        className,
      )}
      data-testid={testId}
    >
      {iconClass && (
        <i className={cn("size-4 transition-all duration-200", iconClass, iconClassName)} />
      )}
      <span className="font-medium">{children}</span>
    </m.button>
  )
}

interface HeaderActionGroupProps {
  children: ReactNode
  className?: string
}

export const HeaderActionGroup = ({ children, className }: HeaderActionGroupProps) => {
  return <div className={cn("flex items-center gap-2", className)}>{children}</div>
}
