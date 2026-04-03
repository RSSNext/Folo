import { cn } from "@follow/utils/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-md bg-fill-tertiary", className)} {...props} />
}
