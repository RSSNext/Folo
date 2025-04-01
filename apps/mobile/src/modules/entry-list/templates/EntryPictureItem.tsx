import { tracker } from "@follow/tracker"
import { uniqBy } from "es-toolkit/compat"
import { useMemo } from "react"
import { Text, View } from "react-native"

import { showEntryGaleriaAccessory } from "@/src/components/native/GaleriaAccessory/EntryGaleriaAccessory"
import { preloadWebViewEntry } from "@/src/components/native/webview/EntryContentWebView"
import { MediaCarousel } from "@/src/components/ui/carousel/MediaCarousel"
import type { MediaModel } from "@/src/database/schemas/types"
import { getFeedIconSource } from "@/src/lib/image"
import { useEntry } from "@/src/store/entry/hooks"
import { getFeed } from "@/src/store/feed/getter"
import { unreadSyncService } from "@/src/store/unread/store"

export function EntryPictureItem({ id }: { id: string }) {
  const item = useEntry(id)

  if (!item || !item.media) {
    return null
  }

  const hasMedia = item.media.length > 0

  if (!hasMedia) {
    return (
      <View className="w-full items-center justify-center" style={{ aspectRatio: 16 / 9 }}>
        <Text className="text-label text-center">No media available</Text>
      </View>
    )
  }

  return (
    <View className="m-1">
      <MediaItems
        media={item.media}
        entryId={id}
        onPreview={() => {
          const feed = getFeed(item.feedId!)
          if (!feed) {
            return
          }
          tracker.navigateEntry({
            feedId: item.feedId!,
            entryId: id,
          })

          showEntryGaleriaAccessory({
            author: item.author || "",
            avatarUrl: getFeedIconSource(feed, "", true) ?? "",
            publishedAt: item.publishedAt.toISOString(),
          })
          preloadWebViewEntry(item)
          unreadSyncService.markEntryAsRead(id)
        }}
      />
    </View>
  )
}

const MediaItems = ({
  media,
  entryId,
  onPreview,
  aspectRatio,
}: {
  media: MediaModel[]
  entryId: string
  onPreview?: () => void
  aspectRatio?: number
}) => {
  const firstMedia = media[0]

  const uniqMedia = useMemo(() => {
    return uniqBy(media, "url")
  }, [media])

  if (!firstMedia) {
    return null
  }

  const { height } = firstMedia
  const { width } = firstMedia
  const realAspectRatio = aspectRatio || (width && height ? width / height : 1)

  return (
    <MediaCarousel
      entryId={entryId}
      media={uniqMedia}
      onPreview={onPreview}
      aspectRatio={realAspectRatio}
    />
  )
}

// const EntryGridItemAccessory = ({ id }: { id: string }) => {
//   const entry = useEntry(id)
//   const feed = useFeed(entry?.feedId || "")
//   const insets = useSafeAreaInsets()

//   const opacityValue = useSharedValue(0)
//   useEffect(() => {
//     opacityValue.value = withTiming(1, { duration: 1000 })
//   }, [opacityValue])
//   if (!entry) {
//     return null
//   }

//   return (
//     <Animated.View style={{ opacity: opacityValue }} className="absolute inset-x-0 bottom-0">
//       <LinearGradient colors={["transparent", "#000"]} locations={[0.1, 1]} className="flex-1">
//         <View className="flex-row items-center gap-2">
//           <View className="border-non-opaque-separator overflow-hidden rounded-full border">
//             <FeedIcon fallback feed={feed} size={40} />
//           </View>
//           <View>
//             <Text className="text-label text-lg font-medium">{entry.author}</Text>
//             <RelativeDateTime className="text-secondary-label" date={entry.publishedAt} />
//           </View>
//         </View>

//         <ScrollView
//           className="mt-2 max-h-48"
//           contentContainerStyle={{ paddingBottom: insets.bottom }}
//         >
//           <EntryContentWebView entry={entry} noMedia />
//         </ScrollView>
//       </LinearGradient>
//     </Animated.View>
//   )
// }
