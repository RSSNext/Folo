import { FeedViewType } from "@follow/constants"
import { getEntry } from "@follow/store/entry/getter"
import { useEntry } from "@follow/store/entry/hooks"
import { getInboxFrom } from "@follow/store/entry/utils"
import { useFeedById } from "@follow/store/feed/hooks"
import { useEntryTranslation } from "@follow/store/translation/hooks"
import { tracker } from "@follow/tracker"
import { cn, formatEstimatedMins, formatTimeToSeconds } from "@follow/utils"
import { useVideoPlayer, VideoView } from "expo-video"
import { memo, useCallback, useMemo, useRef, useState } from "react"
import type { ImageErrorEventData } from "react-native"
import { StyleSheet, Text, View } from "react-native"

import { useActionLanguage } from "@/src/atoms/settings/general"
import { useUISettingKey } from "@/src/atoms/settings/ui"
import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { preloadWebViewEntry } from "@/src/components/native/webview/EntryContentWebView"
import { RelativeDateTime } from "@/src/components/ui/datetime/RelativeDateTime"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { Image } from "@/src/components/ui/image/Image"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { NativePressable } from "@/src/components/ui/pressable/NativePressable"
import { PauseCuteFiIcon } from "@/src/icons/pause_cute_fi"
import { PlayCuteFiIcon } from "@/src/icons/play_cute_fi"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { isIOS } from "@/src/lib/platform"
import { getAttachmentState, player } from "@/src/lib/player"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]/EntryDetailScreen"

import { EntryItemContextMenu } from "../../context-menu/entry"
import { EntryItemSkeleton } from "../EntryListContentArticle"
import type { EntryExtraData } from "../types"
import { EntryTranslation } from "./EntryTranslation"

export const EntryNormalItem = memo(
  ({
    entryId,
    extraData,
    view,
  }: {
    entryId: string
    extraData: EntryExtraData
    view: FeedViewType
  }) => {
    const entry = useEntry(entryId, (state) => ({
      id: state.id,
      feedId: state.feedId,
      inboxHandle: state.inboxHandle,
      authorUrl: state.authorUrl,
      attachments: state.attachments,
      read: state.read,
      publishedAt: state.publishedAt,
      translation: state.settings?.translation,
      title: state.title,
      description: state.description,
    }))
    const actionLanguage = useActionLanguage()
    const translation = useEntryTranslation(entryId, actionLanguage)
    const from = getInboxFrom(entry)
    const feed = useFeedById(entry?.feedId as string)
    const navigation = useNavigation()
    const handlePress = useCallback(() => {
      if (entry) {
        const fullEntry = getEntry(entryId)
        preloadWebViewEntry(fullEntry)
        tracker.navigateEntry({
          feedId: entry.feedId!,
          entryId: entry.id,
        })

        navigation.pushControllerView(EntryDetailScreen, {
          entryId,
          entryIds: extraData.entryIds ?? [],
          view,
        })
      }
    }, [entry, navigation, entryId, extraData.entryIds, view])

    const audioOrVideo = entry?.attachments?.find(
      (attachment) =>
        attachment.mime_type?.startsWith("audio/") || attachment.mime_type?.startsWith("video/"),
    )

    const estimatedMins = useMemo(() => {
      const durationInSeconds = formatTimeToSeconds(audioOrVideo?.duration_in_seconds)
      return durationInSeconds && Math.floor(durationInSeconds / 60)
    }, [audioOrVideo?.duration_in_seconds])

    if (!entry) return <EntryItemSkeleton />

    return (
      <EntryItemContextMenu id={entryId} view={view}>
        <ItemPressable
          itemStyle={ItemPressableStyle.Plain}
          className={cn(
            view === FeedViewType.Notifications ? "p-2" : "p-4",
            "flex flex-row items-center pl-6",
          )}
          onPress={handlePress}
        >
          {!entry.read && (
            <View
              className={cn(
                "bg-red absolute left-2 size-2 rounded-full",
                view === FeedViewType.Notifications ? "top-[35]" : "top-[43]",
              )}
            />
          )}
          <View className="flex-1 space-y-2 self-start">
            <View className="mb-1 flex-row items-center gap-1.5 pr-2">
              <FeedIcon fallback feed={feed} size={view === FeedViewType.Notifications ? 14 : 16} />
              <Text numberOfLines={1} className="text-secondary-label shrink text-sm font-medium">
                {feed?.title || from || "Unknown feed"}
              </Text>
              <Text className="text-secondary-label text-xs font-medium">·</Text>
              {estimatedMins ? (
                <>
                  <Text className="text-secondary-label text-xs font-medium">
                    {formatEstimatedMins(estimatedMins)}
                  </Text>
                  <Text className="text-secondary-label text-xs font-medium">·</Text>
                </>
              ) : null}
              <RelativeDateTime
                date={entry.publishedAt}
                className="text-secondary-label text-xs font-medium"
              />
            </View>
            {!!entry.title && (
              <EntryTranslation
                numberOfLines={2}
                className={cn(
                  view === FeedViewType.Notifications ? "text-base" : "text-lg",
                  "text-label font-semibold",
                )}
                source={entry.title}
                target={translation?.title}
                showTranslation={!!entry.translation}
                inline
              />
            )}
            {view !== FeedViewType.Notifications && !!entry.description && (
              <EntryTranslation
                numberOfLines={2}
                className="text-secondary-label my-0 text-sm"
                source={entry.description}
                target={translation?.description}
                showTranslation={!!entry.translation}
                inline
              />
            )}
          </View>
          {view !== FeedViewType.Notifications && (
            <ThumbnailImage entryId={entryId} playingAudioUrl={extraData.playingAudioUrl} />
          )}
        </ItemPressable>
      </EntryItemContextMenu>
    )
  },
)

EntryNormalItem.displayName = "EntryNormalItem"

const ThumbnailImage = ({
  playingAudioUrl,
  entryId,
}: {
  playingAudioUrl: string | null
  entryId: string
}) => {
  const entry = useEntry(entryId, (state) => ({
    feedId: state.feedId,
    media: state.media,
    attachments: state.attachments,
    title: state.title,
  }))

  const feed = useFeedById(entry?.feedId as string)
  const thumbnailRatio = useUISettingKey("thumbnailRatio")

  const mediaModel = entry?.media?.find(
    (media) => media.type === "photo" || (media.type === "video" && media.preview_image_url),
  )
  const image = mediaModel?.type === "photo" ? mediaModel?.url : null // mediaModel?.preview_image_url
  const blurhash = mediaModel?.blurhash

  const audio = entry?.attachments?.find((attachment) => attachment.mime_type?.startsWith("audio/"))
  const audioState = getAttachmentState(playingAudioUrl ?? undefined, audio)
  const isPlaying = audioState === "playing"
  const isLoading = audioState === "loading"

  const video = mediaModel?.type === "video" ? mediaModel : null
  const videoViewRef = useRef<null | VideoView>(null)
  const videoPlayer = useVideoPlayer(video?.url ?? "")
  const [showVideoNativeControlsForAndroid, setShowVideoNativeControlsForAndroid] = useState(false)

  const handlePressPlay = useCallback(() => {
    if (video) {
      setShowVideoNativeControlsForAndroid(true)
      // Ensure the nativeControls is ready before entering fullscreen for Android
      setTimeout(() => {
        videoViewRef.current?.enterFullscreen()
      }, 0)
      if (videoPlayer.playing) {
        videoPlayer.pause()
      } else {
        videoPlayer.play()
      }
      return
    }
    if (!audio) return
    if (isLoading) return
    if (isPlaying) {
      player.pause()
      return
    }
    player.play({
      url: audio.url,
      title: entry?.title,
      artist: feed?.title,
      artwork: image,
    })
  }, [audio, entry?.title, feed?.title, image, isLoading, isPlaying, video, videoPlayer])

  const [imageError, setImageError] = useState(audio && !image)
  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  if (!image && !audio && !video) return null
  const isSquare = thumbnailRatio === "square"
  return (
    <View className={cn("relative ml-4 h-24 overflow-hidden rounded-lg", isSquare ? "h-24" : "")}>
      {image &&
        (thumbnailRatio === "square" ? (
          <SquareImage image={image} blurhash={blurhash} onError={handleImageError} />
        ) : (
          <AspectRatioImage
            blurhash={blurhash}
            image={image}
            height={mediaModel?.height}
            width={mediaModel?.width}
            onError={handleImageError}
          />
        ))}

      {video && (
        <View className="absolute left-0 top-0 size-full overflow-hidden rounded-lg">
          <VideoView
            style={{ aspectRatio: 1 }}
            contentFit="cover"
            ref={videoViewRef}
            player={videoPlayer}
            // The Android native controls will be shown when the video is paused
            nativeControls={isIOS || showVideoNativeControlsForAndroid}
            accessible={false}
            allowsFullscreen={false}
            allowsVideoFrameAnalysis={false}
            onFullscreenExit={() => {
              videoPlayer.pause()
              setShowVideoNativeControlsForAndroid(false)
            }}
          />
        </View>
      )}

      {/* Show feed icon if no image but audio is present */}
      {imageError && <FeedIcon feed={feed} size={96} />}

      {(video || audio) && (
        <NativePressable
          className="absolute inset-0 flex items-center justify-center"
          onPress={handlePressPlay}
        >
          <View className="overflow-hidden rounded-full p-2">
            <ThemedBlurView
              style={StyleSheet.absoluteFillObject}
              intensity={30}
              experimentalBlurMethod="none"
            />
            {isPlaying ? (
              <PauseCuteFiIcon color="white" width={24} height={24} />
            ) : isLoading ? (
              <PlatformActivityIndicator />
            ) : (
              <PlayCuteFiIcon color="white" width={24} height={24} />
            )}
          </View>
        </NativePressable>
      )}
    </View>
  )
}

const AspectRatioImage = ({
  image,
  blurhash,
  height = 96,
  width = 96,
  onError,
}: {
  image: string
  blurhash?: string
  height?: number
  width?: number
  onError?: (event: ImageErrorEventData) => void
}) => {
  if (height === width || !height || !width) {
    return <SquareImage image={image} blurhash={blurhash} onError={onError} />
  }
  // Calculate aspect ratio and determine dimensions
  // Ensure the larger dimension is capped at 96px while maintaining aspect ratio

  const aspect = height / width
  let scaledWidth, scaledHeight

  if (aspect > 1) {
    // Image is taller than wide
    scaledHeight = 96
    scaledWidth = scaledHeight / aspect
  } else {
    // Image is wider than tall or square
    scaledWidth = 96
    scaledHeight = scaledWidth * aspect
  }

  return (
    <View className="ml-auto flex h-full justify-center overflow-hidden rounded-lg">
      <Image
        proxy={{
          width: 96,
        }}
        source={{
          uri: image,
        }}
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
        transition={100}
        blurhash={blurhash}
        contentFit="cover"
        hideOnError
        onError={onError}
      />
    </View>
  )
}

const SquareImage = ({
  image,
  blurhash,
  onError,
}: {
  image: string
  blurhash?: string
  onError?: (event: ImageErrorEventData) => void
}) => {
  return (
    <View className="size-24 overflow-hidden rounded-lg">
      <Image
        proxy={{
          width: 96,
          height: 96,
        }}
        style={{
          width: 96,
          height: 96,
        }}
        transition={100}
        source={{
          uri: image,
        }}
        blurhash={blurhash}
        onError={onError}
      />
    </View>
  )
}
