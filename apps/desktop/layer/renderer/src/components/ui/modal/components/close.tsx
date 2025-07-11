import { cn } from "@follow/utils"
import { useTranslation } from "react-i18next"

import { GlassButton } from "~/components/ui/button/GlassButton"

export const FixedModalCloseButton: Component<{
  onClick: () => void
  className?: string
}> = ({ onClick, className }) => {
  const { t } = useTranslation("common")
  return (
    <GlassButton
      onClick={onClick}
      className={cn(
        "!border-red-500/20 !bg-red-600/30 !opacity-100 hover:!bg-red-600/50",
        className,
      )}
      description={t("words.close")}
      size="md"
      variant="flat"
    >
      <i className="i-mgc-close-cute-re text-lg" />
    </GlassButton>
  )
}
