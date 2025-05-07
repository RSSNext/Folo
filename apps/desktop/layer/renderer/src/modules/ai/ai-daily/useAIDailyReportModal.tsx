import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useModalStack } from "~/components/ui/modal/stacked/hooks"

import { FeedDailyModalContent } from "./FeedDailyModalContent"

export const useAIDailyReportModal = () => {
  const { present } = useModalStack()
  const { t } = useTranslation()

  return useCallback(() => {
    present({
      content: () => <FeedDailyModalContent />,
      title: t("ai_daily.header"),
      resizeable: true,
      clickOutsideToDismiss: true,

      resizeDefaultSize: { width: 660, height: 450 },
    })
  }, [present, t])
}
