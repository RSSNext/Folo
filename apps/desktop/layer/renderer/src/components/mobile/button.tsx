import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

export const HeaderTopReturnBackButton: Component<{ to?: string }> = ({ className, to }) => {
  const { t } = useTranslation()
  return (
    <MotionButtonBase
      onClick={() => window.history.returnBack(to)}
      className={cn("center size-8", className)}
    >
      <i className="i-mingcute-left-line size-6" />

      <span className="sr-only">{t("words.back", { ns: "common" })}</span>
    </MotionButtonBase>
  )
}
