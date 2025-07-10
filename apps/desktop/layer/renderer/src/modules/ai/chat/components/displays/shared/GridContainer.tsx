import { cn } from "@follow/utils/utils"
import type { ReactNode } from "react"

export interface GridContainerProps {
  columns?: {
    base: number
    md: number
    lg?: number
  }
  gap?: number
  children: ReactNode
  className?: string
}

export const GridContainer = ({
  columns = { base: 1, md: 2 },
  gap = 4,
  children,
  className,
}: GridContainerProps) => (
  <div
    className={cn(
      "grid",
      `grid-cols-${columns.base}`,
      `md:grid-cols-${columns.md}`,
      columns.lg && `lg:grid-cols-${columns.lg}`,
      `gap-${gap}`,
      className,
    )}
  >
    {children}
  </div>
)
