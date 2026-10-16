import type { FeedViewType } from "@follow/constants"
import type { MediaModel } from "@follow/database/schemas/types"
import { useRecyclingState } from "@shopify/flash-list"
import type { ImageSource } from "expo-image"
import type { Ref } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ScrollView, View } from "react-native"
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

import { EntryGridFooter } from "@/src/modules/entry-content/EntryGridFooter"

import { Image } from "../image/Image"
import { ImageContextMenu } from "../image/ImageContextMenu"
import { getAllSources } from "../image/utils"
import { NativePressable } from "../pressable/NativePressable"
import { VideoPlayer } from "../video/VideoPlayer"

const getMediaKey = (mediaItem: MediaModel) =>
  mediaItem.url || mediaItem.preview_image_url || `${mediaItem.type}-media`

// Thumbnails are sized to the card, rounded up so that a slightly different layout asks for the
// same URL and hits the cache
const THUMBNAIL_SIZE_STEP = 50
const toThumbnailSize = (size: number) =>
  Math.ceil(size / THUMBNAIL_SIZE_STEP) * THUMBNAIL_SIZE_STEP

export const MediaCarousel = ({
  ref,
  entryId,
  media,
  onPreview,
  aspectRatio,
  view,
}: {
  ref?: Ref<View>
  entryId: string
  media: MediaModel[]
  onPreview?: (index: number, thumbnail: ImageSource | undefined) => void
  aspectRatio: number
  view: FeedViewType
}) => {
  const [containerWidth, setContainerWidth] = useState(0)
  const containerHeight = Math.floor(containerWidth / aspectRatio)
  const hasMany = media.length > 1
  // Media without an image get no page, so a page's position can differ from its media index
  const pages = useMemo(
    () =>
      media.flatMap((m, index) => {
        const imageUrl = m.type === "video" ? m.preview_image_url : m.url
        return imageUrl ? [{ media: m, index, imageUrl }] : []
      }),
    [media],
  )

  // The list recycles this row for other entries, which start at their first image
  const scrollViewRef = useRef<ScrollView>(null)
  const [activeIndex, setActiveIndex] = useRecyclingState(0, [entryId], () => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: false })
  })

  return (
    <View
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width)
      }}
    >
      {/* Sized by the aspect ratio before the width is measured: a row laid out without its image
          is so short that the list mounts far more rows than fit on screen */}
      <View ref={ref} className="relative overflow-hidden rounded-md" style={{ aspectRatio }}>
        <ScrollView
          ref={scrollViewRef}
          onMomentumScrollEnd={(e) => {
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / containerWidth))
          }}
          scrollEnabled={hasMany}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          className="flex-1"
          // We need to fixed the height of the container to prevent the carousel from resizing
          // See https://github.com/Shopify/flash-list/issues/797
          style={{ height: containerHeight }}
        >
          {pages.map(({ media: m, index, imageUrl }, position) => {
            // An entry can carry dozens of images, so only the visible page and its neighbors load,
            // and only once the card is measured, as their thumbnails are sized to it
            if (!containerWidth || Math.abs(position - activeIndex) > 1) {
              return (
                <View key={imageUrl} style={{ width: containerWidth, height: containerHeight }} />
              )
            }
            // The image covers the card, so one relatively wider than the card needs the card's
            // height and any other its width. Asking for one side keeps the image uncropped
            const proxy =
              m.width && m.height && m.width / m.height > aspectRatio
                ? { height: toThumbnailSize(containerHeight) }
                : { width: toThumbnailSize(containerWidth) }
            const ImageItem = (
              <NativePressable
                onPress={() => {
                  // The proxied thumbnail is what this card shows, so the lightbox can show it from
                  // the cache while the original loads
                  const [, thumbnail] = getAllSources({ uri: imageUrl }, proxy)
                  onPreview?.(index, thumbnail)
                }}
              >
                <Image
                  proxy={proxy}
                  source={{ uri: imageUrl }}
                  blurhash={m.blurhash}
                  className="w-full"
                  aspectRatio={aspectRatio}
                  placeholderContentFit="cover"
                />
              </NativePressable>
            )

            if (m.type === "photo") {
              return (
                <View
                  key={imageUrl}
                  className="relative"
                  style={{ width: containerWidth, height: containerHeight }}
                >
                  <ImageContextMenu entryId={entryId} imageUrl={imageUrl} view={view}>
                    {ImageItem}
                  </ImageContextMenu>
                </View>
              )
            } else if (m.type === "video") {
              return (
                <ImageContextMenu key={imageUrl} entryId={entryId} imageUrl={imageUrl} view={view}>
                  <VideoPlayer
                    source={m.url}
                    height={containerHeight}
                    width={containerWidth}
                    placeholder={ImageItem}
                    view={view}
                  />
                </ImageContextMenu>
              )
            } else {
              return null
            }
          })}
        </ScrollView>

        {/* Indicators */}
        {hasMany && (
          <View className="absolute inset-x-0 bottom-0 flex-row items-center justify-center gap-1">
            {media.map((mediaItem, mediaIndex) => (
              <Indicator
                key={`indicator-${getMediaKey(mediaItem)}`}
                index={mediaIndex}
                activeIndex={activeIndex}
              />
            ))}
          </View>
        )}
      </View>
      <EntryGridFooter entryId={entryId} view={view!} />
    </View>
  )
}

const Indicator = ({ index, activeIndex }: { index: number; activeIndex: number }) => {
  const activeValue = useSharedValue(0)
  useEffect(() => {
    activeValue.value = withSpring(index === activeIndex ? 1 : 0)
  }, [activeIndex, activeValue, index])
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      activeValue.value,
      [0, 1],
      ["rgba(0, 0, 0, 0.5)", "rgba(255, 255, 255, 0.9)"],
    ),
  }))
  return <Animated.View className="h-1 flex-1 rounded-sm" style={animatedStyle} />
}
