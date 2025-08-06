import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@follow/components/ui/card/index.js"

export interface StatCardProps {
  title: string
  value: string | number
  description?: string
  emoji?: string
}

export const StatCard = ({ title, value, description, emoji }: StatCardProps) => (
  <Card className="p-4">
    <CardHeader className="p-2 pt-0">
      <CardTitle className="text-text-secondary flex items-center gap-2 text-sm font-medium">
        {emoji && <span className="text-base">{emoji}</span>}
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="px-2 py-0">
      <div className="text-text text-2xl font-bold">{value}</div>
      {description && <CardDescription className="mt-1 text-xs">{description}</CardDescription>}
    </CardContent>
  </Card>
)
