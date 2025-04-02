import { Tooltip, TooltipContent, TooltipTrigger } from "@follow/components/ui/tooltip/index.js"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

export const FixedModalCloseButton: Component<{
  onClick: () => void
  className?: string
}> = ({ onClick, className }) => {
  const { t } = useTranslation("common")
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"
        className={cn(
          "no-drag-region center bg-background flex size-8 rounded-full p-1 shadow-sm ring-1 ring-zinc-200 dark:ring-neutral-800",
          className,
        )}
        onClick={onClick}
      >
        <i className="i-mgc-close-cute-re text-lg" />
        <span className="sr-only">{t("words.close")}</span>
      </TooltipTrigger>
      <TooltipContent>{t("words.close")}</TooltipContent>
    </Tooltip>
  )
}
