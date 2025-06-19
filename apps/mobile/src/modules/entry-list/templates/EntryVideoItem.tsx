import { FeedViewType } from "@follow/constants"
import { useEntry } from "@follow/store/entry/hooks"
import { unreadSyncService } from "@follow/store/unread/store"
import { tracker } from "@follow/tracker"
import { formatDuration, transformVideoUrl } from "@follow/utils"
import { memo, useMemo } from "react"
import { Linking, Text, View } from "react-native"

import { getGeneralSettings } from "@/src/atoms/settings/general"
import { Image } from "@/src/components/ui/image/Image"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { openLink } from "@/src/lib/native"
import { toast } from "@/src/lib/toast"

import { VideoContextMenu } from "../../context-menu/video"
import { EntryGridFooter } from "../../entry-content/EntryGridFooter"

export const EntryVideoItem = memo(({ id }: { id: string }) => {
  const item = useEntry(id, (state) => ({
    attachments: state.attachments,
    media: state.media,
    feedId: state.feedId,
    url: state.url,
  }))

  const duration = useMemo(() => {
    const seconds = item?.attachments?.find(
      (attachment) => attachment.duration_in_seconds,
    )?.duration_in_seconds
    if (seconds) {
      return formatDuration(Number.parseInt(seconds.toString()))
    }
    return 0
  }, [item?.attachments])

  if (!item) {
    return null
  }

  const imageUrl = item.media?.at(0)?.url

  return (
    <View className="m-1">
      <VideoContextMenu entryId={id}>
        <ItemPressable
          itemStyle={ItemPressableStyle.Plain}
          onPress={() => {
            unreadSyncService.markEntryAsRead(id)
            tracker.navigateEntry({
              feedId: item.feedId!,
              entryId: id,
            })
            if (!item.url) {
              toast.error("No video URL found")
              return
            }

            openVideo(item.url)
          }}
        >
          <View className="relative">
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                aspectRatio={16 / 9}
                className="w-full rounded-lg"
                proxy={{
                  width: 200,
                }}
              />
            ) : (
              <FallbackMedia />
            )}
            {!!duration && (
              <Text className="absolute bottom-2 right-2 rounded-md bg-black/50 px-1 py-0.5 text-xs font-medium text-white">
                {duration}
              </Text>
            )}
          </View>
          <EntryGridFooter entryId={id} view={FeedViewType.Videos} />
        </ItemPressable>
      </VideoContextMenu>
    </View>
  )
})

EntryVideoItem.displayName = "EntryVideoItem"

const FallbackMedia = () => (
  <View
    className="bg-tertiary-system-fill w-full items-center justify-center rounded-lg"
    style={{ aspectRatio: 16 / 9 }}
  >
    <Text className="text-label text-center">No media available</Text>
  </View>
)

const parseSchemeLink = (url: string) => {
  let urlObject: URL
  try {
    urlObject = new URL(url)
  } catch {
    return null
  }

  switch (urlObject.hostname) {
    case "www.bilibili.com": {
      // bilibili://video/{av}or{bv}
      const bvid = urlObject.pathname.match(/video\/(BV\w+)/)?.[1]
      return bvid ? `bilibili://video/${bvid}` : null
    }
    case "t.bilibili.com": {
      const id = urlObject.pathname.match(/\d+/)?.[0]
      return id ? `bilibili://following/detail/${id}` : null
    }
    case "www.youtube.com": {
      // youtube://watch?v=xxx
      const videoId = urlObject.searchParams.get("v")
      return videoId ? `youtube://watch?v=${videoId}` : null
    }
    default: {
      return null
    }
  }
}

const openVideo = async (url: string) => {
  const { openLinksInExternalApp } = getGeneralSettings()
  if (openLinksInExternalApp) {
    const schemeLink = parseSchemeLink(url)
    try {
      const isInstalled = !!schemeLink && (await Linking.canOpenURL(schemeLink))
      if (schemeLink && isInstalled) {
        await Linking.openURL(schemeLink)
        return
      }
    } catch {
      // Ignore error
    }
  }

  // Fallback to opening in in-app browser
  const formattedUrl = transformVideoUrl({ url }) || url
  openLink(formattedUrl)
}
