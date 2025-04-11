import { FeedViewType } from "@follow/constants"
import { cn } from "@follow/utils"
import { useEffect } from "react"
import { Text, View } from "react-native"
import ReAnimated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { gentleSpringPreset } from "@/src/constants/spring"
import { useEntry } from "@/src/store/entry/hooks"
import { useFeed } from "@/src/store/feed/hooks"
import { useEntryTranslation } from "@/src/store/translation/hooks"

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
  const entry = useEntry(entryId)

  const translation = useEntryTranslation(entryId)
  const feed = useFeed(entry?.feedId || "")

  const unreadZoomSharedValue = useSharedValue(entry?.read ? 0 : 1)

  useEffect(() => {
    if (!entry) return

    if (entry.read) {
      unreadZoomSharedValue.value = withSpring(0, gentleSpringPreset)
    } else {
      unreadZoomSharedValue.value = withSpring(1, gentleSpringPreset)
    }
  }, [entry, entry?.read, unreadZoomSharedValue])

  const unreadIndicatorStyle = useAnimatedStyle(() => {
    return {
      width: unreadZoomSharedValue.value * 8,
      height: unreadZoomSharedValue.value * 8,
    }
  })

  if (!entry) return null

  return (
    <View className={cn("my-1 px-1", view === FeedViewType.Videos && "h-[52]")}>
      <View className="flex-row gap-1">
        <ReAnimated.View
          className="bg-red mt-1.5 inline-block rounded-full"
          style={unreadIndicatorStyle}
        />
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
            showTranslation={!!entry.settings?.translation}
            inline
          />
        )}
      </View>
      <View className="mt-1 flex-row items-center gap-1.5">
        <FeedIcon fallback feed={feed} size={14} />
        <Text numberOfLines={1} className="text-label shrink text-xs font-medium">
          {feed?.title}
        </Text>
        <RelativeDateTime className="text-secondary-label text-xs" date={entry.publishedAt} />
      </View>
    </View>
  )
}
