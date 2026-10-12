import { getFeedById } from "@follow/store/feed/getter"
import { EventBus } from "@follow/utils/event-bus"
import { Portal } from "@gorhom/portal"
import TrackPlayer from "@rntp/player"
import { useAtom } from "jotai"
import * as React from "react"
import { useCallback, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Dimensions, Pressable, StyleSheet, View } from "react-native"
import { runOnJS, runOnUI } from "react-native-reanimated"

import { openLink } from "@/src/lib/native"
import { player } from "@/src/lib/player"
import { getEntryArtwork } from "@/src/modules/player/artwork"

import { useLightboxControls } from "../../ui/lightbox/lightboxState"
import { PlatformActivityIndicator } from "../../ui/loading/PlatformActivityIndicator"
import { Text } from "../../ui/typography/Text"
import { sharedWebViewHeightAtom } from "./atom"
import { DebugPanel } from "./DebugPanel"
import { useWebViewEntry, useWebViewMode } from "./hooks"
import type { AudioSeekEvent } from "./index"
import { prepareEntryRenderWebView } from "./index"
import { NativeWebView } from "./native-webview"
import { WebViewManager } from "./webview-manager"

type EntryContentWebViewProps = {
  entryId: string
  noMedia?: boolean
  showReadability?: boolean
  showTranslation?: boolean
  /**
   * Whether the content is still being requested. Once it is not, missing content shows a
   * message instead of the spinner. Without it, the spinner shows while the content is missing.
   */
  isContentPending?: boolean
}

// Export for backward compatibility

export function EntryContentWebView(props: EntryContentWebViewProps) {
  const { t } = useTranslation()
  const [contentHeight, setContentHeight] = useAtom(sharedWebViewHeightAtom)
  const { openLightbox } = useLightboxControls()

  // Use custom hooks for WebView management
  const { entryInWebview, isLoading: isContentMissing } = useWebViewEntry(props)
  const isLoading = isContentMissing && props.isContentPending !== false
  const { handleModeSwitch, mode } = useWebViewMode()

  const handleSeekAudio = useCallback(
    async (e: AudioSeekEvent) => {
      const activeTrack = TrackPlayer.getActiveMediaItem()
      const entryAudio = entryInWebview?.attachments?.find((attachment) =>
        attachment.mime_type?.startsWith("audio/"),
      )
      if (!entryAudio) {
        console.warn("Failed to seek audio! No audio attachment found")
        return
      }
      if (activeTrack?.mediaId !== entryAudio.url) {
        await player.play({
          url: entryAudio.url || "",
          title: entryInWebview?.title || t("player.unknown_title"),
          artist: entryInWebview?.author || t("player.unknown_artist"),
          artwork: getEntryArtwork(
            entryInWebview?.media?.find((media) => media.type === "photo")?.url,
            getFeedById(entryInWebview?.feedId),
          ),
        })
      }
      await player.seekTo(e.time)
    },
    [
      entryInWebview?.attachments,
      entryInWebview?.author,
      entryInWebview?.feedId,
      entryInWebview?.media,
      entryInWebview?.title,
      t,
    ],
  )

  // Handle audio seek events
  useEffect(() => {
    return EventBus.subscribe("SEEK_AUDIO", (event) => {
      handleSeekAudio(event)
    })
  }, [handleSeekAudio])

  // Handle image preview events
  useEffect(() => {
    return EventBus.subscribe("PREVIEW_IMAGE", (event) => {
      const { imageUrls, index } = event

      runOnUI(() => {
        "worklet"
        runOnJS(openLightbox)({
          images: imageUrls.map((url: string) => ({
            uri: url,
            dimensions: null,
            thumbUri: url,
            thumbDimensions: null,
            thumbRect: null,
            type: "image",
          })),
          index,
        })
      })()
    })
  }, [openLightbox])

  // Initialize WebView once
  const onceRef = React.useRef(false)
  if (!onceRef.current) {
    onceRef.current = true
    prepareEntryRenderWebView()
  }

  const handleModeToggle = React.useCallback(() => {
    const nextMode = mode === "debug" ? "normal" : "debug"
    handleModeSwitch(nextMode)
  }, [mode, handleModeSwitch])

  useEffect(() => {
    // Reset the shared container height before the next entry content arrives.
    setContentHeight(Dimensions.get("window").height)
  }, [props.entryId, props.showReadability, props.showTranslation, setContentHeight])

  return (
    <>
      <View
        key={`${mode}-${props.entryId}`}
        style={{ width: "100%", height: contentHeight, transform: [{ translateY: 0 }] }}
        onLayout={() => {
          WebViewManager.setEntry(entryInWebview)
        }}
      >
        <NativeWebView
          style={styles.webView}
          onContentHeightChange={(e) => {
            setContentHeight(e.nativeEvent.height)
          }}
          onSeekAudio={handleSeekAudio}
        />
      </View>

      <Portal>
        {isLoading ? (
          <View className="absolute inset-0 items-center justify-center">
            <PlatformActivityIndicator />
          </View>
        ) : (
          isContentMissing && <ContentUnavailable url={entryInWebview?.url} />
        )}
      </Portal>
      <DebugPanel mode={mode} onModeToggle={handleModeToggle} />
    </>
  )
}

const ContentUnavailable = ({ url }: { url?: string | null }) => {
  const { t } = useTranslation()
  return (
    <View className="absolute inset-x-0 top-1/3 items-center gap-3 px-8">
      <Text className="text-center text-base text-secondary-label">
        {t("entry_content.unavailable")}
      </Text>
      {!!url && (
        <Pressable
          accessibilityRole="link"
          className="rounded-full bg-secondary-system-fill px-4 py-2"
          onPress={() => openLink(url)}
        >
          <Text className="text-base font-medium text-accent">
            {t("entry_content.header.open_in_browser")}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  webView: {
    width: "100%",
    height: "100%",
  },
})
