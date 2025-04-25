import { cn } from "@follow/utils/utils"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("bg-material-opaque animate-pulse rounded-md", className)} {...props} />
}
