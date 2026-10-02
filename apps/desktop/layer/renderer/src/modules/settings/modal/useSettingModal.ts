import { createElement, useCallback } from "react"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  const { present } = useModalStack()

  return useCallback(
    (options?: SettingModalOptions) => {
      const { tab, section } = normalizeOptions(options)

      return present({
        title: t("user_button.preferences"),
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
    [present, t],
  )
}
