import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useEntryTranslation } from "@follow/store/translation/hooks"
import { cn } from "@follow/utils"
import { Text, View } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"

import { EntryTranslation } from "../entry-list/templates/EntryTranslation"

export const EntryGridFooter = ({
  entryId,
  descriptionClassName,
  view,
}: {
  entryId: string
  descriptionClassName?: string
  view: FeedViewType
}) => {
  const entry = useEntry(entryId, (state) => ({
    title: state.title,
    feedId: state.feedId,
    publishedAt: state.publishedAt,
    read: state.read,
    translation: state.settings?.translation,
  }))
  const enableTranslation = useGeneralSettingKey("translation")
  const actionLanguage = useActionLanguage()
  const translation = useEntryTranslation({
    entryId,
    language: actionLanguage,
    setting: enableTranslation,
  })
  const feed = useFeedById(entry?.feedId || "")

  if (!entry) return null

  return (
    <View className="gap-2 px-1 py-2">
      <View className="flex-row gap-1">
        {!entry.read && <View className="bg-red mt-1.5 inline-block size-2 rounded-full" />}
        {entry.title && (
          <EntryTranslation
            numberOfLines={2}
            className={cn(
              "text-label shrink text-sm font-medium",
              view === FeedViewType.Videos && "min-h-10",
              descriptionClassName,
            )}
            source={entry.title}
            target={translation?.title}
            showTranslation={!!entry.translation}
            inline
          />
        )}
      </View>
      <View className="flex-row items-center gap-1.5">
        <FeedIcon fallback feed={feed} size={14} />
        <Text numberOfLines={1} className="text-label shrink text-xs font-medium">
          {feed?.title}
        </Text>
        <RelativeDateTime className="text-secondary-label text-xs" date={entry.publishedAt} />
      </View>
    </View>
  )
}
