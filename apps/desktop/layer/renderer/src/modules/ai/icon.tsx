import { cn } from "@follow/utils/utils"

export const AIIcon = ({ className }: { className?: string }) => {
  return <div className={cn("bg-accent/80 size-8 rounded-full", className)} />
}
