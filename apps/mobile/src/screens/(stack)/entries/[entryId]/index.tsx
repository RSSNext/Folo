import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs"
import type { AVPlaybackStatus } from "expo-av"
import { Video } from "expo-av"
import { Image } from "expo-image"
import { useLocalSearchParams } from "expo-router"
import type { FC } from "react"
import { Fragment, useState } from "react"
import { Text, TouchableOpacity, useWindowDimensions, View } from "react-native"
import PagerView from "react-native-pager-view"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"

import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/common/SafeNavigationScrollView"
import HtmlWeb from "@/src/components/ui/typography/HtmlWeb"
import type { MediaModel } from "@/src/database/schemas/types"
import { More1CuteReIcon } from "@/src/icons/more_1_cute_re"
import { useEntry, usePrefetchEntryContent } from "@/src/store/entry/hooks"

function Media({ media }: { media: MediaModel }) {
  const isVideo = media.type === "video"
  const imageUrl = isVideo ? media.preview_image_url : media.url
  const videoUrl = media.url

  const [status, setStatus] = useState<AVPlaybackStatus | null>(null)
  if (!imageUrl && !videoUrl) {
    return null
  }

  return (
    <>
      {isVideo && (
        <Video
          source={{ uri: media.url }}
          style={{
            width: "100%",
            aspectRatio: media.width && media.height ? media.width / media.height : 1,
            display: status?.isLoaded ? "flex" : "none",
          }}
          useNativeControls
          shouldPlay
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />
      )}
      <View className="flex-1 justify-center">
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            placeholder={{ blurhash: media.blurhash }}
            style={{
              width: "100%",
              aspectRatio: media?.height && media.width ? media.width / media.height : 9 / 16,
              display: isVideo ? (status?.isLoaded ? "none" : "flex") : "flex",
            }}
            contentFit="contain"
            placeholderContentFit="contain"
          />
        ) : (
          <Text className="text-gray-4 text-center">No media</Text>
        )}
      </View>
    </>
  )
}

export default function EntryDetailPage() {
  const { entryId } = useLocalSearchParams()
  usePrefetchEntryContent(entryId as string)
  const item = useEntry(entryId as string)

  const [height, setHeight] = useState(0)

  const insets = useSafeAreaInsets()
  return (
    <BottomTabBarHeightContext.Provider value={insets.bottom}>
      <SafeNavigationScrollView nestedScrollEnabled className="bg-system-grouped-background">
        <NavigationBlurEffectHeader
          headerShown
          headerRight={HeaderRightActions}
          title={item?.title || "Loading..."}
        />
        <HtmlWeb
          content={item?.content || ""}
          onLayout={async (size) => {
            if (size[1] !== height) {
              setHeight(size[1])
            }
          }}
          scrollEnabled={false}
          dom={{
            scrollEnabled: false,
            style: { height },
            matchContents: true,
          }}
        />

        {/* {item && <MediaSwipe mediaList={item?.media || []} id={item.id} />} */}
      </SafeNavigationScrollView>
    </BottomTabBarHeightContext.Provider>
  )
}

// eslint-disable-next-line unused-imports/no-unused-vars
const MediaSwipe: FC<{ mediaList: MediaModel[]; id: string }> = ({ mediaList, id }) => {
  const windowWidth = useWindowDimensions().width

  const maxMediaHeight = Math.max(
    ...mediaList
      .filter((media) => media.height && media.width)
      .map((media) => {
        return windowWidth * (media.height! / media.width!)
      }),
  )
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  return (
    <Fragment>
      {mediaList.length > 0 && (
        <View
          style={{
            height: maxMediaHeight > 0 ? maxMediaHeight : "50%",
            maxHeight: "50%",
          }}
        >
          <PagerView
            key={id}
            style={{ flex: 1 }}
            initialPage={0}
            orientation="horizontal"
            onPageSelected={(event) => {
              setCurrentPageIndex(event.nativeEvent.position)
            }}
          >
            {mediaList.map((media) => {
              return <Media key={media.url} media={media} />
            })}
          </PagerView>

          {mediaList.length > 1 && (
            <View className="my-2 w-full flex-row items-center justify-center gap-2">
              {Array.from({ length: mediaList.length }).map((_, index) => {
                return (
                  <View
                    key={index}
                    className={`size-2 rounded-full ${
                      index === currentPageIndex ? "bg-red" : "bg-gray-2"
                    }`}
                  />
                )
              })}
            </View>
          )}
        </View>
      )}
    </Fragment>
  )
}

const HeaderRightActions = () => {
  return <HeaderRightActionsImpl />
}

const HeaderRightActionsImpl = () => {
  const labelColor = useColor("label")
  return (
    <View>
      <TouchableOpacity hitSlop={10}>
        <More1CuteReIcon color={labelColor} />
      </TouchableOpacity>
    </View>
  )
}
