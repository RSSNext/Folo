import { Card, CardContent, CardHeader, CardTitle } from "@follow/components/ui/card/index.js"
import { cn } from "@follow/utils/utils"

export interface ChartPlaceholderProps {
  title: string
  data: any[]
  height?: string
  className?: string
}

export const ChartPlaceholder = ({
  title,
  data,
  height = "h-32",
  className,
}: ChartPlaceholderProps) => (
  <Card className={cn("p-4", className)}>
    <CardHeader className="pb-2">
      <CardTitle className="text-text-secondary text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pt-0">
      <div
        className={cn(
          "bg-material-medium text-text-tertiary flex items-center justify-center rounded-lg text-sm",
          height,
        )}
      >
        Chart visualization ({data.length} data points)
      </div>
    </CardContent>
  </Card>
)
