import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { ActivationModalContent } from "./ActivationModalContent"

export const useActivationModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation()
  return useCallback(
    () =>
      present({
        title: t("activation.title"),
        content: ActivationModalContent,
        id: "activation",
        autoFocus: false,
      }),
    [present, t],
  )
}
