import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { ShortcutModalContent } from "../ShortcutModalContent"

export const useShortcutsModal = () => {
  const { t } = useTranslation()
  const { present, dismiss, getModalStackById } = useModalStack()
  const id = "shortcuts"

  const showShortcutsModal = useCallback(() => {
    present({
      title: t("shortcuts.guide.title"),
      id,
      overlay: false,
      content: () => <ShortcutModalContent />,
      CustomModalComponent: PlainModal,
      clickOutsideToDismiss: true,
    })
  }, [present, t])

  return useCallback(() => {
    const shortcutsModal = getModalStackById(id)
    if (shortcutsModal && shortcutsModal.modal) {
      dismiss(id)
      return
    }
    showShortcutsModal()
  }, [dismiss, getModalStackById, showShortcutsModal])
}
