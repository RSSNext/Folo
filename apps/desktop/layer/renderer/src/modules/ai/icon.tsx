import { cn } from "@follow/utils/utils"

import { m } from "~/components/common/Motion"

export const AIIcon = ({ className }: { className?: string }) => {
  return (
    <m.div
      layoutId="ai-icon"
      className={cn("bg-accent/80 size-8 rounded-full", className)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    />
  )
}
