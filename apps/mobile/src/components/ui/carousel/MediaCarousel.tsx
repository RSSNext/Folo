import type { FeedViewType } from "@follow/constants"
import type { MediaModel } from "@follow/database/schemas/types"
import { useEffect, useMemo, useState } from "react"
import { ScrollView, View } from "react-native"
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated"

import { Galeria } from "@/src/components/ui/image/galeria"
import { EntryGridFooter } from "@/src/modules/entry-content/EntryGridFooter"

import { Image } from "../image/Image"
import { ImageContextMenu } from "../image/ImageContextMenu"
import { VideoPlayer } from "../video/VideoPlayer"

export const MediaCarousel = ({
  entryId,
  media,
  onPreview,
  aspectRatio,
  view,
}: {
  entryId: string
  media: MediaModel[]
  onPreview?: () => void
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
      <View className="relative overflow-hidden rounded-md">
        <Galeria
          urls={useMemo(
            () =>
              media
                .map((m) =>
                  m.type === "video" ? m.preview_image_url : m.type === "photo" ? m.url : undefined,
                )
                .filter(Boolean) as string[],
            [media],
          )}
        >
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
              const ImageItem = (
                <Galeria.Image onPreview={onPreview} index={index}>
                  <Image
                    proxy={{
                      height: 400,
                    }}
                    source={{ uri: imageUrl }}
                    blurhash={m.blurhash}
                    className="w-full"
                    aspectRatio={aspectRatio}
                    placeholderContentFit="cover"
                  />
                </Galeria.Image>
              )

              if (m.type === "photo") {
                return (
                  <View
                    key={index}
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
                  <ImageContextMenu key={index} entryId={entryId} imageUrl={imageUrl} view={view}>
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
        </Galeria>

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
