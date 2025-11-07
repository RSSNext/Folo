import { cn } from "@follow/utils/utils"

interface UsageProgressRingProps {
  percentage: number
  size?: "sm" | "md" | "lg" | number
  className?: string
}

const sizeMap = {
  sm: 56,
  md: 72,
  lg: 96,
} as const

export const UsageProgressRing = ({
  percentage,
  size = "md",
  className,
}: UsageProgressRingProps) => {
  const normalized = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0))
  const dimension = typeof size === "number" ? size : sizeMap[size]
  const strokeWidth = size === "sm" ? 8 : size === "md" ? 12 : 14
  const radius = (dimension - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalized / 100) * circumference

  // Gradient colors by percentage
  const gradientId = `gradient-${Math.random().toString(36).slice(2, 9)}`
  const gradientColors =
    normalized >= 90
      ? { start: "#ef4444", end: "#dc2626" } // red
      : normalized >= 70
        ? { start: "#f59e0b", end: "#d97706" } // amber
        : { start: "#22c55e", end: "#16a34a" } // green

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: dimension, height: dimension }}
    >
      <svg width={dimension} height={dimension} className="block -scale-100">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientColors.start} />
            <stop offset="100%" stopColor={gradientColors.end} />
          </linearGradient>
        </defs>
        <circle
          className="stroke-fill-secondary"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={dimension / 2}
          cy={dimension / 2}
        />
        <circle
          stroke={`url(#${gradientId})`}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={dimension / 2}
          cy={dimension / 2}
          style={{
            transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            opacity: 0.95,
          }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-text">
        {Math.round(normalized)}%
      </div>
    </div>
  )
}
