import { clsx, cn } from "@follow/utils"
import * as React from "react"

export interface MentionLikePillProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: React.ReactNode
  variant?: "mention" | "command"
  prefix?: string
}

export const MentionLikePill = ({
  className,
  icon,
  children,
  variant = "mention",
  prefix,
  ref,
  ...rest
}: MentionLikePillProps & {
  ref?: React.RefObject<HTMLSpanElement>
}) => {
  const baseStyles =
    "relative inline-flex -translate-y-px select-none items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors"

  const variantStyles = {
    mention: "border-[0.5px] bg-fill-secondary hover:bg-fill",
    command: cn(
      "border border-fill font-mono",
      "bg-fill-secondary/50 hover:bg-fill-secondary",
      "text-text-secondary hover:text-text",
    ),
  }

  return (
    <span ref={ref} className={cn(baseStyles, variantStyles[variant], className)} {...rest}>
      {prefix && variant === "command" ? (
        <span className="mr-0.5 text-[10px] text-text-tertiary opacity-60">{prefix}</span>
      ) : null}
      {icon ? (
        <span
          className={cn(
            "flex items-center justify-center",
            variant === "command" ? "mr-1 size-3" : "absolute left-0.5 top-0 size-5",
          )}
        >
          {icon}
        </span>
      ) : null}
      <span className={clsx("truncate text-xs", variant === "mention" && icon && "ml-3.5")}>
        {children}
      </span>
    </span>
  )
}
