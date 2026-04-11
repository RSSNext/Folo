import { useEffect, useRef } from "react"
import { StyleSheet, View } from "react-native"
import { WebView } from "react-native-webview"

import { ttsStreamController } from "./tts-stream-controller"
import { TTS_STREAM_WEBVIEW_HTML } from "./tts-stream-webview-html"

export const TtsStreamProvider = () => {
  const webViewRef = useRef<WebView>(null)

  useEffect(() => {
    ttsStreamController.attachWebView(webViewRef.current)

    return () => {
      ttsStreamController.attachWebView(null)
    }
  }, [])

  return (
    <View pointerEvents="none" style={styles.container}>
      <WebView
        ref={webViewRef}
        allowsInlineMediaPlayback
        androidLayerType="software"
        cacheEnabled={false}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        onMessage={ttsStreamController.handleMessage}
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
