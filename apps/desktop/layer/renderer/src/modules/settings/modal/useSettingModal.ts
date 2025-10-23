import { createElement, useCallback } from "react"

import { PlainModal } from "~/components/ui/modal/stacked/custom-modal"
import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { SettingModalContent } from "./SettingModalContent"

export type SettingModalOptions =
  | string
  | {
      tab?: string
      section?: string
    }

const normalizeOptions = (options?: SettingModalOptions) => {
  if (!options) return {}
  if (typeof options === "string") {
    return { tab: options }
  }
  return options
}

export const useSettingModal = () => {
  const { present } = useModalStack()

  return useCallback(
    (options?: SettingModalOptions) => {
      const { tab, section } = normalizeOptions(options)

      return present({
        title: "Setting",
        id: "setting",
        content: () =>
          createElement(SettingModalContent, {
            initialTab: tab,
            initialSection: section,
          }),
        CustomModalComponent: PlainModal,
        modalContainerClassName: "overflow-hidden",
      })
    },
    [present],
  )
}
