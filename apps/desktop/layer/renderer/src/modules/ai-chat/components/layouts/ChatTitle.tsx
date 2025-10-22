import { cn } from "@follow/utils/utils"
import type { ButtonHTMLAttributes } from "react"

interface AIHeaderTitleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  title?: string
  placeholder?: string
  onTitleSave?: (newTitle: string) => Promise<void>
}

export const AIHeaderTitle = ({
  ref,
  title = "",
  placeholder = "Untitled Chat",
  className,
  onTitleSave,
  ...buttonProps
}: AIHeaderTitleProps & { ref?: React.RefObject<HTMLButtonElement | null> }) => {
  const displayTitle = title || placeholder
  const { ["aria-label"]: ariaLabelProp, ...restButtonProps } = buttonProps
  const ariaLabel = ariaLabelProp ?? displayTitle

  return (
    <div className="group relative flex min-w-0 flex-1 items-center gap-2">
      <button
        {...restButtonProps}
        ref={ref}
        type="button"
        aria-haspopup="menu"
        aria-label={ariaLabel}
        className={cn(
          "group/button no-drag-region flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-md bg-transparent p-0 text-left",
          "outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-border focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
      >
        <h1 className="truncate font-bold text-text">
          <span className="animate-mask-left-to-right [--animation-duration:1s]">
            {displayTitle}
          </span>
        </h1>
        <i className="i-mingcute-down-line size-4 shrink-0 text-text-secondary transition-all duration-200 group-hover/button:text-text group-data-[state=open]:rotate-180 group-data-[state=open]:text-text" />
      </button>
    </div>
  )
}
