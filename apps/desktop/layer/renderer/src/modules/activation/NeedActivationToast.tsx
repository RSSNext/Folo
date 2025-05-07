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
        className="bg-accent shrink-0 text-white"
        type="button"
        data-button="true"
        data-action="true"
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
