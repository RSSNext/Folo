import { clsx, cn } from "@follow/utils"
import * as React from "react"

export interface MentionLikePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode
}

export const MentionLikePill = ({
  className,
  icon,
  children,
  ref,
  ...rest
}: MentionLikePillProps & {
  ref?: React.RefObject<HTMLSpanElement>
}) => {
  return (
    <span
      ref={ref}
      className={cn(
        "relative inline-flex -translate-y-px select-none items-center rounded-md border-[0.5px] px-2 py-0.5 text-xs font-medium",
        "bg-fill-secondary transition-colors hover:bg-fill",
        className,
      )}
      {...rest}
    >
      {icon ? (
        <span className="absolute left-0.5 top-0 flex size-5 items-center justify-center">
          {icon}
        </span>
      ) : null}
      <span className={clsx("truncate text-xs", icon && "ml-3.5")}>{children}</span>
    </span>
  )
}
