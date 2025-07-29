import { Button } from "@follow/components/ui/button/index.js"
import { useTranslation } from "react-i18next"

export const ConfirmDestroyModalContent = ({ onConfirm }: { onConfirm: () => void }) => {
  const { t } = useTranslation()

  return (
    <div className="w-[540px]">
      <div className="mb-4 text-sm">{t("sidebar.feed_actions.unfollow_feed_many_warning")}</div>
      <div className="flex justify-end">
        <Button buttonClassName="bg-red" onClick={onConfirm}>
          {t("words.confirm")}
        </Button>
      </div>
    </div>
  )
}
