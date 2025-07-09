import type { FeedViewType } from "@follow/constants"
import type { MediaModel } from "@follow/database/schemas/types"
import type { ImageSource } from "expo-image"
import type { Ref } from "react"
import { useEffect, useState } from "react"
import { ScrollView, TouchableOpacity, View } from "react-native"
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
import { VideoPlayer } from "../video/VideoPlayer"

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
  onPreview?: (index: number, placeholder: ImageSource | undefined) => void
  aspectRatio: number
  view: FeedViewType
}) => {
  const [containerWidth, setContainerWidth] = useState(0)
  const containerHeight = Math.floor(containerWidth / aspectRatio)
  const hasMany = media.length > 1

  // const activeIndex = useSharedValue(0)
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <View
      onLayout={(e) => {
        setContainerWidth(e.nativeEvent.layout.width)
      }}
    >
      <View ref={ref} className="relative overflow-hidden rounded-md">
        <ScrollView
          onScroll={(e) => {
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / containerWidth))
          }}
          scrollEventThrottle={16}
          scrollEnabled={hasMany}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          className="flex-1"
          // We need to fixed the height of the container to prevent the carousel from resizing
          // See https://github.com/Shopify/flash-list/issues/797
          style={{ height: containerHeight }}
        >
          {media.map((m, index) => {
            const imageUrl = m.type === "video" ? m.preview_image_url : m.url
            if (!imageUrl) {
              return null
            }
            const proxy = {
              height: 400,
            }
            const ImageItem = (
              <TouchableOpacity
                onPress={() => {
                  const [placeholder] = getAllSources({ uri: imageUrl }, proxy)
                  onPreview?.(index, { blurhash: m.blurhash, ...placeholder })
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
              </TouchableOpacity>
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
            {media.map((_, index) => (
              <Indicator key={index} index={index} activeIndex={activeIndex} />
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
