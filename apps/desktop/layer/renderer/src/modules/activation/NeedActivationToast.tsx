import { toastStyles } from "@follow/components/ui/toast/styles.js"
import { stopPropagation } from "@follow/utils/dom"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useActivationModal } from "."

export const NeedActivationToast = (props: { dimiss: () => void }) => {
  const presentActivationModal = useActivationModal()

  const { t } = useTranslation()
  return (
    <div className="flex justify-between gap-3">
      <div>{t("activation.description")}</div>

      <button
        className={toastStyles.actionButton}
        type="button"
        onPointerDown={stopPropagation}
        onClick={useCallback(() => {
          presentActivationModal()
          props.dimiss()
        }, [presentActivationModal, props])}
      >
        {t("activation.activate")}
      </button>
    </div>
  )
}
