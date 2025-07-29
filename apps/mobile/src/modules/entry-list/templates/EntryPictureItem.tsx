import { FeedViewType } from "@follow/constants"
import type { MediaModel } from "@follow/database/schemas/types"
import { useEntry } from "@follow/store/entry/hooks"
import { getFeedById } from "@follow/store/feed/getter"
import { unreadSyncService } from "@follow/store/unread/store"
import { tracker } from "@follow/tracker"
import { uniqBy } from "es-toolkit/compat"
import type { ImageSource } from "expo-image"
import type { Ref } from "react"
import { useMemo } from "react"
import { View } from "react-native"
import { measure, runOnJS, runOnUI, useAnimatedRef } from "react-native-reanimated"

import { MediaCarousel } from "@/src/components/ui/carousel/MediaCarousel"
import { useLightboxControls } from "@/src/components/ui/lightbox/lightboxState"
import { Text } from "@/src/components/ui/typography/Text"

export function EntryPictureItem({ id }: { id: string }) {
  const { openLightbox } = useLightboxControls()
  const aviRef = useAnimatedRef<View>()
  const item = useEntry(id, (state) => ({
    media: state.media,
    feedId: state.feedId,
    publishedAt: state.publishedAt,
    author: state.author,
  }))
  if (!item || !item.media) {
    return null
  }
  const hasMedia = item.media.length > 0
  if (!hasMedia) {
    return (
      <View
        className="w-full items-center justify-center"
        style={{
          aspectRatio: 16 / 9,
        }}
      >
        <Text className="text-label text-center">No media available</Text>
      </View>
    )
  }
  return (
    <View className="m-1">
      <MediaItems
        ref={aviRef}
        media={item.media}
        entryId={id}
        onPreview={(index, placeholder) => {
          const feed = getFeedById(item.feedId!)
          if (!feed) {
            return
          }
          tracker.navigateEntry({
            feedId: item.feedId!,
            entryId: id,
          })
          runOnUI(() => {
            "worklet"

            const rect = measure(aviRef)
            runOnJS(openLightbox)({
              images: (item.media ?? []).map((media) => ({
                uri: media.url,
                thumbUri: placeholder ?? {
                  uri: media.url,
                },
                thumbDimensions: null,
                thumbRect: rect,
                dimensions: rect
                  ? {
                      height: rect.height,
                      width: rect.width,
                    }
                  : null,
                type: "image",
              })),
              index,
            })
          })()
          // const fullEntry = getEntry(id)
          // preloadWebViewEntry(fullEntry)
          unreadSyncService.markEntryAsRead(id)
        }}
      />
    </View>
  )
}
EntryPictureItem.displayName = "EntryPictureItem"
const MediaItems = ({
  ref,
  media,
  entryId,
  onPreview,
  aspectRatio,
}: {
  ref?: Ref<View>
  media: MediaModel[]
  entryId: string
  onPreview?: (index: number, placeholder: ImageSource | undefined) => void
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
      ref={ref}
      view={FeedViewType.Pictures}
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
