import { useCallback } from "react"

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"
import { LoginModalContent } from "~/modules/auth/LoginModalContent"

export const useLoginModal = () => {
  const { present } = useModalStack()

  return useCallback(() => {
    present({
      CustomModalComponent: PlainModal,
      title: "Login",
      id: "login",
      content: () => <LoginModalContent runtime={window.electron ? "app" : "browser"} />,
      clickOutsideToDismiss: true,
    })
  }, [present])
}
