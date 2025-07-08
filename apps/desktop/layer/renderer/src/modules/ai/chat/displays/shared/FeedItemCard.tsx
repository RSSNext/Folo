import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.js"
import { cn } from "@follow/utils/utils"
import type { ReactNode } from "react"

export interface FeedItemCardProps {
  title: string
  description?: string
  icon?: ReactNode
  headerHeight?: string
  className?: string
  children?: ReactNode
}

export const FeedItemCard = ({
  title,
  description,
  icon,
  headerHeight = "h-24",
  className,
  children,
}: FeedItemCardProps) => (
  <Card className={cn("p-4", className)}>
    <CardHeader className={cn("px-2 py-3", headerHeight)}>
      <div className="flex items-start gap-3">
        {icon && <div className="shrink-0">{icon}</div>}
        <div className="-mt-1 min-w-0 flex-1">
          <CardTitle className="line-clamp-2 text-base">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1 line-clamp-2 text-xs">{description}</CardDescription>
          )}
        </div>
      </div>
    </CardHeader>
    {children && <CardContent className="space-y-3 p-0 px-2 pb-3">{children}</CardContent>}
  </Card>
)
