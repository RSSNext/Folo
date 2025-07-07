import { unreadSyncService } from "@follow/store/unread/store"
import { useTranslation } from "react-i18next"
import { Text, TouchableOpacity } from "react-native"

import { getHideAllReadSubscriptions } from "@/src/atoms/settings/general"
import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import { useColor } from "@/src/theme/colors"

import { getFetchEntryPayload, useSelectedFeed, useSelectedView } from "../screen/atoms"
import { ItemSeparator } from "./ItemSeparator"

export const EntryListFooter = ({ fetchedTime }: { fetchedTime?: number }) => {
  const { t } = useTranslation()
  const selectedView = useSelectedView()
  const selectedFeed = useSelectedFeed()

  const labelColor = useColor("label")
  return (
    <>
      <ItemSeparator />
      <TouchableOpacity
        className="flex-row items-center justify-center gap-1.5 py-6 pl-6"
        onPress={() => {
          if (typeof selectedView === "number") {
            const payload = getFetchEntryPayload(selectedFeed, selectedView)
            unreadSyncService.markBatchAsRead({
              view: selectedView,
              filter: payload,
              time: fetchedTime ? { insertedBefore: fetchedTime } : undefined,
              excludePrivate: getHideAllReadSubscriptions(),
            })
          }
        }}
      >
        <CheckCircleCuteReIcon height={16} width={16} color={labelColor} />
        <Text className="text-label ml-2 font-bold">
          {t("operation.mark_all_as_read_which", {
            which: t("operation.mark_all_as_read_which_above"),
          })}
        </Text>
      </TouchableOpacity>
    </>
  )
}

export const GridEntryListFooter = ({ fetchedTime }: { fetchedTime?: number }) => {
  const { t } = useTranslation()
  const selectedView = useSelectedView()
  const selectedFeed = useSelectedFeed()

  return (
    <TouchableOpacity
      className="flex-row items-center justify-center gap-1.5 py-6"
      onPress={() => {
        if (typeof selectedView === "number") {
          const payload = getFetchEntryPayload(selectedFeed, selectedView)
          unreadSyncService.markBatchAsRead({
            view: selectedView,
            filter: payload,
            time: fetchedTime ? { insertedBefore: fetchedTime } : undefined,
            excludePrivate: getHideAllReadSubscriptions(),
          })
        }
      }}
    >
      <CheckCircleCuteReIcon height={16} width={16} />
      <Text className="text-label font-bold">
        {t("operation.mark_all_as_read_which", {
          which: t("operation.mark_all_as_read_which_above"),
        })}
      </Text>
    </TouchableOpacity>
  )
}
