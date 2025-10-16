import { cn } from "@follow/utils/utils"
import type { ButtonHTMLAttributes } from "react"

interface EditableTitleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  title?: string
  placeholder?: string
}

export const EditableTitle = function EditableTitle({
  ref,
  title = "",
  placeholder = "Untitled Chat",
  className,
  ...buttonProps
}: EditableTitleProps & { ref?: React.RefObject<HTMLButtonElement | null> }) {
  const displayTitle = title || placeholder
  const { ["aria-label"]: ariaLabelProp, ...restButtonProps } = buttonProps
  const ariaLabel = ariaLabelProp ?? displayTitle

  return (
    <button
      {...restButtonProps}
      ref={ref}
      type="button"
      aria-haspopup="menu"
      aria-label={ariaLabel}
      className={cn(
        "group flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md bg-transparent p-0 text-left",
        "focus-visible:ring-border focus-visible:ring-offset-background outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
    >
      <h1 className="text-text truncate font-bold">
        <span className="animate-mask-left-to-right [--animation-duration:1s]">{displayTitle}</span>
      </h1>
      <i className="i-mingcute-down-line text-text-secondary group-data-[state=open]:text-text group-hover:text-text size-4 transition-colors transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </button>
  )
}
