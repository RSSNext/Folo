import { clsx } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import { Portal } from "@gorhom/portal"
import { useAtom } from "jotai"
import * as React from "react"
import { useEffect } from "react"
import { TouchableOpacity, View } from "react-native"
import { runOnJS, runOnUI } from "react-native-reanimated"

import { BugCuteReIcon } from "@/src/icons/bug_cute_re"

import { useLightboxControls } from "../../ui/lightbox/lightboxState"
import { PlatformActivityIndicator } from "../../ui/loading/PlatformActivityIndicator"
import { sharedWebViewHeightAtom } from "./atom"
import { useWebViewEntry, useWebViewMode } from "./hooks"
import { prepareEntryRenderWebView } from "./index"
import { NativeWebView } from "./native-webview"
import { WebViewManager } from "./webview-manager"

type EntryContentWebViewProps = {
  entryId: string
  noMedia?: boolean
  showReadability?: boolean
  showTranslation?: boolean
}

// Export for backward compatibility

export function EntryContentWebView(props: EntryContentWebViewProps) {
  const [contentHeight, setContentHeight] = useAtom(sharedWebViewHeightAtom)
  const { openLightbox } = useLightboxControls()

  // Use custom hooks for WebView management
  const { entryInWebview, isLoading } = useWebViewEntry(props)
  const { handleModeSwitch, mode } = useWebViewMode()

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

  return (
    <>
      <View
        key={mode}
        style={{ height: contentHeight, transform: [{ translateY: 0 }] }}
        onLayout={() => {
          WebViewManager.setEntry(entryInWebview)
        }}
      >
        <NativeWebView
          onContentHeightChange={(e) => {
            setContentHeight(e.nativeEvent.height)
          }}
        />
      </View>

      <Portal>
        {isLoading && (
          <View className="absolute inset-0 items-center justify-center">
            <PlatformActivityIndicator />
          </View>
        )}
      </Portal>
      {__DEV__ && (
        <Portal>
          <View className="bottom-safe-offset-2 absolute left-4 flex-row gap-4">
            <TouchableOpacity
              className={clsx(
                "flex size-12 items-center justify-center rounded-full",
                mode === "debug" ? "bg-yellow" : "bg-red",
              )}
              onPress={handleModeToggle}
            >
              <BugCuteReIcon color="#fff" />
            </TouchableOpacity>
          </View>
        </Portal>
      )}
    </>
  )
}

export { preloadWebViewEntry } from "./webview-manager"
