import { clsx, cn } from "@follow/utils"

interface ScrollToBottomButtonProps {
  onClick: () => void
}

export const ScrollToBottomButton = ({ onClick }: ScrollToBottomButtonProps) => {
  return (
    <div className={clsx("absolute right-1/2 z-40 translate-x-1/2", "bottom-48 -translate-y-2")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "group center flex size-8 items-center gap-2 rounded-full border backdrop-blur-background transition-all bg-mix-background/transparent-8/2",
          "border-border",
          "hover:border-border/60 active:scale-[0.98]",
        )}
      >
        <i className="i-mingcute-arrow-down-line text-text/90" />
      </button>
    </div>
  )
}
