import { cn } from "@follow/utils"
import { m } from "motion/react"
import type { FC } from "react"
import { memo } from "react"

export interface UploadProgressProps {
  /** Progress percentage (0-100) */
  progress: number
  /** Progress bar size variant */
  size?: "sm" | "md" | "lg"
  /** Show percentage text */
  showPercentage?: boolean
  /** Custom className */
  className?: string
  /** Progress bar color */
  variant?: "default" | "success" | "error"
}

export const UploadProgress: FC<UploadProgressProps> = memo(
  ({ progress, size = "md", showPercentage = false, className, variant = "default" }) => {
    const progressValue = Math.max(0, Math.min(100, progress))

    const sizeClasses = {
      sm: "h-1",
      md: "h-2",
      lg: "h-3",
    }

    const colorClasses = {
      default: "bg-blue",
      success: "bg-green",
      error: "bg-red",
    }

    return (
      <div className={cn("w-full", className)}>
        {/* Progress Bar */}
        <div
          className={cn(
            "bg-fill-secondary relative overflow-hidden rounded-full",
            sizeClasses[size],
          )}
        >
          <m.div
            className={cn("h-full rounded-full transition-colors", colorClasses[variant])}
            initial={{ width: 0 }}
            animate={{ width: `${progressValue}%` }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 100,
            }}
          />
        </div>

        {/* Percentage Text */}
        {showPercentage && (
          <div className="text-text-tertiary mt-1 text-center text-xs">
            {Math.round(progressValue)}%
          </div>
        )}
      </div>
    )
  },
)

UploadProgress.displayName = "UploadProgress"

export interface CircularProgressProps {
  /** Progress percentage (0-100) */
  progress: number
  /** Circle size */
  size?: number
  /** Stroke width */
  strokeWidth?: number
  /** Show percentage text in center */
  showPercentage?: boolean
  /** Custom className */
  className?: string
  /** Progress color */
  variant?: "default" | "success" | "error"
}

export const CircularProgress: FC<CircularProgressProps> = memo(
  ({
    progress,
    size = 20,
    strokeWidth = 2,
    showPercentage = false,
    className,
    variant = "default",
  }) => {
    const progressValue = Math.max(0, Math.min(100, progress))
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (progressValue / 100) * circumference

    const colorClasses = {
      default: "text-blue",
      success: "text-green",
      error: "text-red",
    }

    return (
      <div className={cn("relative inline-flex items-center justify-center", className)}>
        <svg
          width={size}
          height={size}
          className="-rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-fill-tertiary"
          />

          {/* Progress circle */}
          <m.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className={colorClasses[variant]}
            strokeLinecap="round"
            initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              type: "spring",
              damping: 20,
              stiffness: 100,
            }}
          />
        </svg>

        {/* Percentage text */}
        {showPercentage && (
          <div className="text-text-tertiary absolute inset-0 flex items-center justify-center text-xs font-medium">
            {Math.round(progressValue)}%
          </div>
        )}
      </div>
    )
  },
)

CircularProgress.displayName = "CircularProgress"
