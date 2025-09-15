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
  const strokeWidth = size === "sm" ? 6 : size === "md" ? 8 : 10
  const radius = (dimension - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (normalized / 100) * circumference

  // Color coding by percentage
  const color = normalized >= 90 ? "#ef4444" : normalized >= 70 ? "#f59e0b" : "#22c55e"

  return (
    <div
      className={cn("relative inline-block", className)}
      style={{ width: dimension, height: dimension }}
    >
      <svg width={dimension} height={dimension} className="block -scale-100">
        <circle
          className="stroke-fill-secondary"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={dimension / 2}
          cy={dimension / 2}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={dimension / 2}
          cy={dimension / 2}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      <div className="text-text absolute inset-0 grid place-items-center text-sm font-medium">
        {Math.round(normalized)}%
      </div>
    </div>
  )
}
