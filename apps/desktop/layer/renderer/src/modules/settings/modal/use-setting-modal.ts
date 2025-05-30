import { isMobile } from "@follow/components/hooks/useMobile.js"
import { createElement, useCallback } from "react"

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { SettingModalContent } from "./content"
import { MobileSettingModalContent } from "./content.mobile"

export const useSettingModal = () => {
  const { present } = useModalStack()

  return useCallback(
    (initialTab?: string) => {
      const mobile = isMobile()

      if (mobile) {
        return present({
          title: "",
          id: "setting",
          content: () =>
            createElement(MobileSettingModalContent, {
              initialTab,
            }),
        })
      }
      return present({
        title: "Setting",
        id: "setting",
        content: () =>
          createElement(SettingModalContent, {
            initialTab,
          }),
        CustomModalComponent: PlainModal,
        modalContainerClassName: "overflow-hidden",
      })
    },
    [present],
  )
}
