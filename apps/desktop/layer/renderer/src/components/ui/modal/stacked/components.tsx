import { MotionButtonBase } from "@follow/components/ui/button/index.js"
import { useTranslation } from "react-i18next"

import { useCurrentModal } from "./hooks"

export const ModalClose = () => {
  const { dismiss } = useCurrentModal()
  const { t } = useTranslation("common")

  return (
    <MotionButtonBase
      aria-label={t("words.close")}
      className="hover:bg-material-ultra-thick absolute right-6 top-6 flex size-8 items-center justify-center rounded-md duration-200"
      onClick={dismiss}
    >
      <i className="i-mgc-close-cute-re block" />
    </MotionButtonBase>
  )
}
