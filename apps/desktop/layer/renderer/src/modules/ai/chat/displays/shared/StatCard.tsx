import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.js"
import { cn } from "@follow/utils/utils"

export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  emoji?: string
  className?: string
}

export const StatCard = ({ title, value, description, className, emoji }: StatCardProps) => (
  <Card className={cn("p-4", className)}>
    <CardHeader className="pb-2">
      <CardTitle className="text-text-secondary flex items-center gap-2 text-sm font-medium">
        {emoji && <span className="text-base">{emoji}</span>}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div className="text-text text-2xl font-bold">{value}</div>
      {description && <CardDescription className="mt-1 text-xs">{description}</CardDescription>}
    </CardContent>
  </Card>
)
