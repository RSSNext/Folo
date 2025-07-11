import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { UpgradePlanModalContent } from "./UpgradePlanModalContent"

export const useActivationModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation()
  return useCallback(
    () =>
      present({
        title: t("activation.plan.title"),
        content: UpgradePlanModalContent,
        id: "activation",
        autoFocus: false,
      }),
    [present, t],
  )
}
