import { createElement, useCallback } from "react"

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { SettingModalContent } from "./content"

export const useSettingModal = () => {
  const { present } = useModalStack()

  return useCallback(
    (initialTab?: string) =>
      present({
        title: "Setting",
        id: "setting",
        content: () =>
          createElement(SettingModalContent, {
            initialTab,
          }),
        CustomModalComponent: PlainModal,
        modalContainerClassName: "overflow-hidden",
      }),
    [present],
  )
}
