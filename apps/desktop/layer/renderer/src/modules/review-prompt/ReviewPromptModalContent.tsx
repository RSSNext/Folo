import { Button } from "@follow/components/ui/button/index.js"
import { useTranslation } from "react-i18next"

export const ReviewPromptModalContent = ({
  dismiss,
  onNegative,
  onPositive,
}: {
  dismiss: () => void
  onNegative: () => void
  onPositive: () => void
}) => {
  const { t } = useTranslation("settings")

  return (
    <div className="flex min-w-80 max-w-md flex-col gap-4">
      <p className="text-sm leading-relaxed text-text-secondary">{t("reviewPrompt.description")}</p>

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => {
            onNegative()
            dismiss()
          }}
        >
          {t("reviewPrompt.notReally")}
        </Button>

        <Button
          onClick={() => {
            onPositive()
            dismiss()
          }}
        >
          {t("reviewPrompt.loveIt")}
        </Button>
      </div>
    </div>
  )
}
