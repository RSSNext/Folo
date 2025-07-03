import { cn } from "@follow/utils/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-fill-tertiary animate-pulse rounded-md", className)} {...props} />
}
