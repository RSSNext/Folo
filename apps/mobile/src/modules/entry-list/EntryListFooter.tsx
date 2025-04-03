import { useTranslation } from "react-i18next"
import { Pressable, Text } from "react-native"

import { CheckCircleCuteReIcon } from "@/src/icons/check_circle_cute_re"
import { unreadSyncService } from "@/src/store/unread/store"

import { useSelectedView } from "../screen/atoms"
import { ItemSeparator } from "./ItemSeparator"

export const EntryListFooter = () => {
  const { t } = useTranslation()
  const selectedView = useSelectedView()

  return (
    <>
      <ItemSeparator />
      <Pressable
        className="flex-row items-center gap-1.5 py-6 pl-6"
        onPress={() => {
          if (typeof selectedView === "number") {
            unreadSyncService.markViewAsRead(selectedView)
          }
        }}
      >
        <CheckCircleCuteReIcon height={16} width={16} />
        <Text className="text-label font-bold">
          {t("operation.mark_all_as_read_which", {
            which: t("operation.mark_all_as_read_which_above"),
          })}
        </Text>
      </Pressable>
    </>
  )
}

export const GridEntryListFooter = () => {
  const { t } = useTranslation()
  const selectedView = useSelectedView()

  return (
    <Pressable
      className="flex-row items-center justify-center gap-1.5 py-6"
      onPress={() => {
        if (typeof selectedView === "number") {
          unreadSyncService.markViewAsRead(selectedView)
        }
      }}
    >
      <CheckCircleCuteReIcon height={16} width={16} />
      <Text className="text-label font-bold">
        {t("operation.mark_all_as_read_which", {
          which: t("operation.mark_all_as_read_which_above"),
        })}
      </Text>
    </Pressable>
  )
}
