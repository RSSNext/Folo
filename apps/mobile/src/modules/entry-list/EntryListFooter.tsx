import { useTranslation } from "react-i18next"
import { Text, TouchableOpacity } from "react-native"

import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import { getFetchEntryPayload } from "@/src/store/entry/getter"
import { unreadSyncService } from "@/src/store/unread/store"
import { useColor } from "@/src/theme/colors"

import { useSelectedFeed, useSelectedView } from "../screen/atoms"
import { ItemSeparator } from "./ItemSeparator"

export const EntryListFooter = () => {
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
            unreadSyncService.markViewAsRead(selectedView, payload)
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

export const GridEntryListFooter = () => {
  const { t } = useTranslation()
  const selectedView = useSelectedView()
  const selectedFeed = useSelectedFeed()

  return (
    <TouchableOpacity
      className="flex-row items-center justify-center gap-1.5 py-6"
      onPress={() => {
        if (typeof selectedView === "number") {
          const payload = getFetchEntryPayload(selectedFeed, selectedView)
          unreadSyncService.markViewAsRead(selectedView, payload)
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
