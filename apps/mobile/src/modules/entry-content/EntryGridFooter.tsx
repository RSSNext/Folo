import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useEntryTranslation } from "@follow/store/translation/hooks"
import { cn } from "@follow/utils"
import { View } from "react-native"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { Text } from "@/src/components/ui/typography/Text"

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
    enabled: enableTranslation,
  })
  const feed = useFeedById(entry?.feedId || "")
  if (!entry) return null
  return (
    <View className="gap-2 px-1 py-2">
      <View className="flex-row gap-1">
        {!entry.read && <View className="mt-1.5 inline-block size-2 rounded-full bg-red" />}
        {entry.title && (
          <EntryTranslation
            numberOfLines={2}
            className={cn(
              "shrink text-sm font-medium text-label",
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
        <Text numberOfLines={1} className="shrink text-xs font-medium text-label">
          {feed?.title}
        </Text>
        <RelativeDateTime className="text-xs text-secondary-label" date={entry.publishedAt} />
      </View>
    </View>
  )
}
