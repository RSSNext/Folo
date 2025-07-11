import { cn } from "@follow/utils/utils"

export interface CategoryTagProps {
  category: string
  variant?: "default" | "small"
  className?: string
}

export const CategoryTag = ({ category, variant = "default", className }: CategoryTagProps) => (
  <span
    className={cn(
      "bg-fill-tertiary text-text-secondary rounded px-2 py-1 text-xs",
      variant === "small" && "px-1 py-0.5 text-xs",
      className,
    )}
  >
    {category}
  </span>
)
