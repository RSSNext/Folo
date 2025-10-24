import { cn } from "@follow/utils/utils"

export interface EmptyStateProps {
  message: string
  icon?: string
  className?: string
}

export const EmptyState = ({ message, icon, className }: EmptyStateProps) => (
  <div className={cn("text-center text-sm text-text-secondary", className)}>
    {icon && <span className="text-lg">{icon}</span>}
    {message}
  </div>
)
