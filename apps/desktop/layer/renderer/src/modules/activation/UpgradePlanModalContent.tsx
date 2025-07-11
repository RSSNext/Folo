import { Button } from "@follow/components/ui/button/index.js"
import { cn } from "@follow/utils/utils"
import { useTranslation } from "react-i18next"

import type { ModalActionsInternal } from "~/components/ui/modal"
import { useCurrentModal } from "~/components/ui/modal/stacked/hooks"

import { useSetSettingTab } from "../settings/modal/context"
import { useSettingModal } from "../settings/modal/useSettingModal"

export const UpgradePlanModalContent = ({
  className,
}: {
  className?: string
} & Partial<ModalActionsInternal>) => {
  const { t } = useTranslation()
  const settingModalPresent = useSettingModal()
  const { dismiss } = useCurrentModal()
  const setSettingTab = useSetSettingTab()

  return (
    <div
      className={cn("flex w-[512px] max-w-full flex-col gap-2 overflow-hidden px-0.5", className)}
    >
      <p>{t("activation.plan.description")}</p>
      <Button
        buttonClassName="w-fit self-end"
        onClick={() => {
          settingModalPresent("plan")
          setSettingTab("plan")
          dismiss()
        }}
      >
        {t("activation.plan.upgrade")}
      </Button>
    </div>
  )
}
