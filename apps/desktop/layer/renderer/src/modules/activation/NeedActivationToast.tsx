import { toastStyles } from "@follow/components/ui/toast/styles.js"
import { stopPropagation } from "@follow/utils/dom"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useSettingModal } from "../settings/modal/useSettingModal"

export const NeedActivationToast = (props: { dimiss: () => void }) => {
  const settingModalPresent = useSettingModal()

  const { t } = useTranslation()
  return (
    <div className="flex justify-between gap-3">
      <div>{t("activation.plan.description")}</div>

      <button
        className={toastStyles.actionButton}
        type="button"
        onPointerDown={stopPropagation}
        onClick={useCallback(() => {
          settingModalPresent("plan")
          props.dimiss()
        }, [settingModalPresent, props])}
      >
        {t("activation.activate")}
      </button>
    </div>
  )
}
