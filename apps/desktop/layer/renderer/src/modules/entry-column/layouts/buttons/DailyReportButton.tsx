import { ActionButton } from "@follow/components/ui/button/action-button.js"
import { tracker } from "@follow/tracker"
import type { FC } from "react"
import { useTranslation } from "react-i18next"

import { useAIDailyReportModal } from "~/modules/ai-daily/useAIDailyReportModal"

export const DailyReportButton: FC = () => {
  const present = useAIDailyReportModal()
  const { t } = useTranslation()

  return (
    <ActionButton
      onClick={() => {
        present()
        tracker.dailyReportModal()
      }}
      tooltip={t("entry_list_header.daily_report")}
    >
      <i className="i-mgc-ai-cute-re" />
    </ActionButton>
  )
}
