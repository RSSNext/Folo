import { cn } from "@follow/utils"
import * as React from "react"

export interface MentionLikePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode
}

const MentionLikePillBase = (
  { className, icon, children, ...rest }: MentionLikePillProps,
  ref: React.ForwardedRef<HTMLSpanElement>,
) => {
  return (
    <span
      ref={ref}
      className={cn(
        "text-text inline-flex select-none items-center gap-1 rounded-md border px-2 py-0.5 text-sm font-medium",
        "bg-fill-secondary hover:bg-fill transition-colors",
        className,
      )}
      {...rest}
    >
      {icon ? (
        <span className="inline-flex min-h-4 min-w-4 items-center justify-center text-base leading-none">
          {icon}
        </span>
      ) : null}
      <span className="truncate leading-tight">{children}</span>
    </span>
  )
}

MentionLikePillBase.displayName = "MentionLikePill"

export const MentionLikePill = React.forwardRef<HTMLSpanElement, MentionLikePillProps>(
  MentionLikePillBase,
)
