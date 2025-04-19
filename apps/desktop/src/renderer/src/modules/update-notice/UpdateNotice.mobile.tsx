import { m } from "motion/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { getUpdaterStatus, setUpdaterStatus, useUpdaterStatus } from "~/atoms/updater"
import { softBouncePreset } from "~/components/ui/constants/spring"

export const UpdateNotice = () => {
  const updaterStatus = useUpdaterStatus()
  const { t } = useTranslation()

  const handleClick = useCallback(() => {
    const status = getUpdaterStatus()
    if (!status) return

    switch (status.type) {
      case "pwa": {
        status.finishUpdate?.()
        break
      }
    }
    setUpdaterStatus(null)
  }, [])

  if (!updaterStatus) return null

  return (
    <m.div
      className={
        "border-theme-border bg-theme-modal-background bottom-safe-offset-3 group absolute inset-x-3 cursor-pointer overflow-hidden rounded-lg border py-3 text-center text-sm shadow backdrop-blur"
      }
      onClick={handleClick}
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={softBouncePreset}
    >
      <div className="font-medium">{t("notify.update_info", { app_name: APP_NAME })}</div>
      <div className="text-xs text-zinc-500">{t("notify.update_info_3")}</div>
    </m.div>
  )
}
