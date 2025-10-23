import { Portal } from "@gorhom/portal"
import * as React from "react"
import { useEffect, useMemo, useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"

import { BugCuteReIcon } from "@/src/icons/bug_cute_re"
import { CloseCuteReIcon } from "@/src/icons/close_cute_re"

import { htmlUrl } from "./constants"
import type { WebViewDebugState } from "./index"
import { SharedWebViewModule } from "./index"

interface DebugPanelProps {
  mode: "debug" | "normal"
  onModeToggle: () => void
}

const SimpleButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <TouchableOpacity
    onPress={onPress}
    className="mr-2 rounded bg-gray-200 px-2 py-1 dark:bg-gray-700"
    activeOpacity={0.7}
  >
    <Text className="text-xs text-label">{label}</Text>
  </TouchableOpacity>
)

export function DebugPanel({ mode, onModeToggle }: DebugPanelProps) {
  const [visible, setVisible] = useState(false)
  const [debugState, setDebugState] = useState<WebViewDebugState | null>(null)

  // Get debug state periodically
  useEffect(() => {
    const id = setInterval(() => {
      try {
        const d = SharedWebViewModule.getDebugState?.()
        if (d) setDebugState(d as WebViewDebugState)
      } catch {
        /* empty */
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Simple debug info
  const debugInfo = useMemo(() => {
    if (!debugState) return "Loading..."
    const ready = debugState.ready && debugState.hasWebView
    return `${ready ? "✅" : "❌"} WV:${debugState.hasWebView} H:${Math.round(debugState.contentHeight)}`
  }, [debugState])

  if (!__DEV__) return null

  return (
    <Portal>
      {/* Debug Float Button */}
      <View className="bottom-safe-offset-2 absolute left-4 flex-row gap-4">
        <TouchableOpacity
          className="flex size-12 items-center justify-center rounded-full bg-orange-500"
          onPress={() => setVisible(true)}
        >
          <BugCuteReIcon color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Debug Panel */}
      {visible && (
        <View className="absolute inset-x-4 bottom-20 rounded-lg bg-white p-3 shadow-lg dark:bg-gray-900">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-label">WebView Debug</Text>
            <TouchableOpacity onPress={() => setVisible(false)}>
              <CloseCuteReIcon width={16} height={16} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <Text className="mb-3 font-mono text-xs text-gray-600 dark:text-gray-400">
            {debugInfo}
          </Text>

          <View className="flex-row flex-wrap gap-y-2">
            <SimpleButton label={`Mode: ${mode}`} onPress={onModeToggle} />
            <SimpleButton label="Destroy" onPress={() => SharedWebViewModule.destroyForDebug?.()} />
            <SimpleButton label="Reload" onPress={() => SharedWebViewModule.reloadLastURL?.()} />
            <SimpleButton label="Prewarm" onPress={() => SharedWebViewModule.load(htmlUrl)} />
            <SimpleButton label="Flush" onPress={() => SharedWebViewModule.flushQueue?.()} />
          </View>
        </View>
      )}
    </Portal>
  )
}
