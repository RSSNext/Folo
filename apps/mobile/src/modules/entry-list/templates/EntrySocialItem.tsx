import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { useFeedById } from "@follow/store/feed/hooks"
import { useEntryTranslation } from "@follow/store/translation/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { tracker } from "@follow/tracker"
import { memo, useCallback } from "react"
import { Pressable, Text, View } from "react-native"
import { runOnJS, runOnUI } from "react-native-reanimated"

import { useActionLanguage, useGeneralSettingKey } from "@/src/atoms/settings/general"
import { useLightboxControls } from "@/src/components/lightbox/lightboxState"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { Image } from "@/src/components/ui/image/Image"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { NativePressable } from "@/src/components/ui/pressable/NativePressable"
import { VideoPlayer } from "@/src/components/ui/video/VideoPlayer"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]/EntryDetailScreen"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]/FeedScreen"

import { EntryItemContextMenu } from "../../context-menu/entry"
import { EntryItemSkeleton } from "../EntryListContentSocial"
import type { EntryExtraData } from "../types"
import { EntryTranslation } from "./EntryTranslation"

export const EntrySocialItem = memo(
  ({ entryId, extraData }: { entryId: string; extraData: EntryExtraData }) => {
    const entry = useEntry(entryId, (state) => ({
      feedId: state.feedId,
      media: state.media,
      description: state.description,
      publishedAt: state.publishedAt,
      read: state.read,
      authorAvatar: state.authorAvatar,
      author: state.author,
      translation: state.settings?.translation,
    }))
    const actionLanguage = useActionLanguage()
    const translation = useEntryTranslation(entryId, actionLanguage)
    const { openLightbox } = useLightboxControls()

    const feed = useFeedById(entry?.feedId || "")

    const navigation = useNavigation()
    const handlePress = useCallback(() => {
      unreadSyncService.markEntryAsRead(entryId)
      tracker.navigateEntry({
        feedId: entry?.feedId!,
        entryId,
      })
      navigation.pushControllerView(EntryDetailScreen, {
        entryId,
        entryIds: extraData.entryIds ?? [],
        view: FeedViewType.SocialMedia,
      })
    }, [entry?.feedId, entryId, extraData.entryIds, navigation])

    const autoExpandLongSocialMedia = useGeneralSettingKey("autoExpandLongSocialMedia")

    const navigationToFeedEntryList = useCallback(() => {
      if (!entry) return
      if (!entry.feedId) return
      navigation.pushControllerView(FeedScreen, {
        feedId: entry.feedId,
      })
    }, [entry, navigation])

    const onPreviewImage = useCallback(
      (index: number) => {
        runOnUI(() => {
          "worklet"
          // const rect = measureHandle(aviHandle)
          runOnJS(openLightbox)({
            images: (entry?.media ?? [])
              .map((mediaItem) => {
                const imageUrl =
                  mediaItem.type === "video"
                    ? mediaItem.preview_image_url
                    : mediaItem.type === "photo"
                      ? mediaItem.url
                      : undefined
                return {
                  uri: imageUrl ?? "",
                  dimensions: {
                    width: mediaItem.width ?? 0,
                    height: mediaItem.height ?? 0,
                  },
                  thumbUri: imageUrl ?? "",
                  thumbDimensions: null,
                  thumbRect: null,
                  type: "image" as const,
                }
              })
              .filter((i) => !!i.uri),
            index,
          })
        })()
      },
      [entry?.media, openLightbox],
    )

    if (!entry) return <EntryItemSkeleton />

    const { description, publishedAt, media } = entry

    return (
      <EntryItemContextMenu id={entryId} view={FeedViewType.SocialMedia}>
        <ItemPressable
          itemStyle={ItemPressableStyle.Plain}
          className="flex flex-col gap-2 p-4 pl-6"
          onPress={handlePress}
        >
          {!entry.read && (
            <View className="bg-red absolute left-1.5 top-[25] size-2 rounded-full" />
          )}

          <View className="flex flex-1 flex-row items-start gap-4">
            <NativePressable hitSlop={10} onPress={navigationToFeedEntryList}>
              {entry.authorAvatar ? (
                <UserAvatar
                  preview={false}
                  size={28}
                  name={entry.author ?? ""}
                  image={entry.authorAvatar}
                />
              ) : (
                feed && <FeedIcon feed={feed} size={28} />
              )}
            </NativePressable>

            <View className="flex-1 flex-row items-center gap-1.5">
              <NativePressable hitSlop={10} onPress={navigationToFeedEntryList}>
                <Text numberOfLines={1} className="text-label shrink text-base font-semibold">
                  {entry.author || feed?.title}
                </Text>
              </NativePressable>
              <Text className="text-secondary-label">·</Text>
              <RelativeDateTime date={publishedAt} className="text-secondary-label text-[14px]" />
            </View>
          </View>

          <View className="relative -mt-4">
            <EntryTranslation
              numberOfLines={autoExpandLongSocialMedia ? undefined : 7}
              className="text-label ml-12 text-base"
              source={description}
              target={translation?.description}
              showTranslation={!!entry?.translation}
            />
          </View>

          {media && media.length > 0 && (
            <View className="ml-10 flex flex-row flex-wrap justify-between">
              <>
                {media.map((mediaItem, index) => {
                  const imageUrl =
                    mediaItem.type === "video"
                      ? mediaItem.preview_image_url
                      : mediaItem.type === "photo"
                        ? mediaItem.url
                        : undefined
                  const fullWidth = index === media.length - 1 && media.length % 2 === 1
                  if (!imageUrl) return null

                  const ImageItem = (
                    <NativePressable
                      onPress={() => {
                        onPreviewImage(index)
                      }}
                    >
                      <Image
                        proxy={{
                          width: fullWidth ? 400 : 200,
                        }}
                        source={{ uri: imageUrl }}
                        blurhash={mediaItem.blurhash}
                        className="border-secondary-system-background w-full rounded-lg border"
                        aspectRatio={
                          fullWidth && mediaItem.width && mediaItem.height
                            ? mediaItem.width / mediaItem.height
                            : 1
                        }
                      />
                    </NativePressable>
                  )

                  if (mediaItem.type === "video") {
                    return (
                      <View key={`${entryId}-${mediaItem.url}`} className="w-full">
                        <VideoPlayer
                          source={{
                            uri: mediaItem.url,
                          }}
                          height={mediaItem.height}
                          width={mediaItem.width}
                          placeholder={ImageItem}
                          view={FeedViewType.SocialMedia}
                        />
                      </View>
                    )
                  }
                  return (
                    <Pressable
                      key={`${entryId}-${imageUrl}`}
                      className={fullWidth ? "w-full" : "w-1/2 p-0.5"}
                    >
                      {ImageItem}
                    </Pressable>
                  )
                })}
              </>
            </View>
          )}
        </ItemPressable>
      </EntryItemContextMenu>
    )
  },
)

EntrySocialItem.displayName = "EntrySocialItem"
