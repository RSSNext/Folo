import TrackPlayer, { Event } from "@rntp/player"
import { useEffect, useRef, useState } from "react"
import { StyleSheet, View } from "react-native"
import type { WebViewProps } from "react-native-webview"
import { WebView } from "react-native-webview"

import { handleNativePlaybackStarted } from "./entry-tts"
import { ttsStreamController } from "./tts-stream-controller"
import { TTS_STREAM_WEBVIEW_HTML } from "./tts-stream-webview-html"

export const TtsStreamProvider = () => {
  const webViewRef = useRef<WebView<WebViewProps>>(null)
  // Bumped to mount a fresh WebView after the system killed the content process of the old one
  const [webViewKey, setWebViewKey] = useState(0)

  useEffect(() => {
    ttsStreamController.attachWebView(webViewRef.current)

    return () => {
      ttsStreamController.attachWebView(null)
    }
  }, [webViewKey])

  useEffect(() => {
    const subscription = TrackPlayer.addEventListener(Event.IsPlayingChanged, ({ playing }) => {
      if (playing) {
        void handleNativePlaybackStarted()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])

  const recreateWebView = () => {
    setWebViewKey((key) => key + 1)
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <WebView<WebViewProps>
        key={webViewKey}
        ref={webViewRef}
        allowsInlineMediaPlayback
        androidLayerType="software"
        cacheEnabled={false}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        onContentProcessDidTerminate={recreateWebView}
        onMessage={ttsStreamController.handleMessage}
        onRenderProcessGone={recreateWebView}
        originWhitelist={["*"]}
        scrollEnabled={false}
        source={{ html: TTS_STREAM_WEBVIEW_HTML }}
        style={styles.webView}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 1,
    left: -10_000,
    opacity: 0,
    pointerEvents: "none",
    position: "absolute",
    top: 0,
    width: 1,
  },
  webView: {
    backgroundColor: "transparent",
    height: 1,
    width: 1,
  },
})
