import { requireNativeView } from "expo"
import type * as React from "react"
import { useState } from "react"
import { View } from "react-native"

const NativeView: React.ComponentType<{
  onContentHeightChange?: (e: { nativeEvent: { height: number } }) => void
  url: string
}> = requireNativeView("FOSharedWebView")

export default function SharedWebView({ url }: { url: string }) {
  const [contentHeight, setContentHeight] = useState(0)

  return (
    <View style={{ height: contentHeight }}>
      <NativeView
        onContentHeightChange={(e) => {
          setContentHeight(e.nativeEvent.height)
        }}
        url={url}
      />
    </View>
  )
}
