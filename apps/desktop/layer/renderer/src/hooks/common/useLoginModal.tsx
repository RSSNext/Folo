import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { LoginModalContent } from "~/modules/auth/LoginModalContent"

export const useLoginModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation()

  return useCallback(() => {
    present({
      CustomModalComponent: PlainModal,
      title: t("words.login"),
      id: "login",
      content: () => <LoginModalContent runtime={window.electron ? "app" : "browser"} />,
      clickOutsideToDismiss: true,
    })
  }, [present, t])
}
