import { useCallback } from "react"

import { useAsyncModal } from "~/components/ui/modal/helper/use-async-modal"
import { useI18n } from "~/hooks/common"

import { useFeedBoostMap } from "./atom"
import { BoostModalContent } from "./modal"
import { useBoostStatusQuery } from "./query"

export const useBoostModal = () => {
  const t = useI18n()
  const present = useAsyncModal()

  return useCallback(
    (feedId: string) => {
      const useDataFetcher = () => useBoostStatusQuery(feedId)

      type ResponseType = Awaited<ReturnType<ReturnType<typeof useDataFetcher>["fn"]>>

      present<ResponseType>({
        id: `boost-${feedId}`,
        title: t("words.boost"),
        content: () => <BoostModalContent feedId={feedId} />,
        overlay: true,
        useDataFetcher,
        clickOutsideToDismiss: true,
      })
    },
    [present, t],
  )
}

export const useIsFeedBoosted = (feedId: string) => {
  const map = useFeedBoostMap()
  return map[feedId] ?? false
}
