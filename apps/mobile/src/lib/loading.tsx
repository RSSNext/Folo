import { BlurView } from "expo-blur"
import type { FC } from "react"
import { useEffect, useRef, useState } from "react"
import { Platform, Pressable, StyleSheet, TouchableOpacity, View } from "react-native"
import RootSiblings from "react-native-root-siblings"

import { FullWindowOverlay } from "../components/common/FullWindowOverlay"
import { RotateableLoading } from "../components/common/RotateableLoading"
import { PlatformActivityIndicator } from "../components/ui/loading/PlatformActivityIndicator"
import { CloseCuteReIcon } from "../icons/close_cute_re"

class LoadingStatic {
  start(): { done: () => void }
  start<T>(promise: Promise<T>): Promise<T>
  start<T>(promise?: Promise<T>) {
    const siblings = new RootSiblings(<LoadingContainer cancel={() => siblings.destroy()} />)

    if (promise) {
      promise.finally(() => siblings.destroy())
      return promise
    } else {
      return {
        done: () => {
          siblings.destroy()
        },
      }
    }
  }
}

export const loading = new LoadingStatic()

const LoadingContainer: FC<{
  cancel: () => void
}> = ({ cancel }) => {
  const cancelTimerRef = useRef<NodeJS.Timeout | null>(null)

  const [showCancelButton, setShowCancelButton] = useState(false)
  useEffect(() => {
    cancelTimerRef.current = setTimeout(() => {
      setShowCancelButton(true)
    }, 3000)
    return () => {
      if (cancelTimerRef.current) {
        clearTimeout(cancelTimerRef.current)
      }
    }
  }, [])

  return (
    <FullWindowOverlay>
      {/* Pressable to prevent the overlay from being clicked */}
      <Pressable style={StyleSheet.absoluteFillObject} className="items-center justify-center">
        <View className="border-non-opaque-separator relative overflow-hidden rounded-2xl border p-12">
          <BlurView style={StyleSheet.absoluteFillObject} tint="systemChromeMaterialDark" />
          {Platform.OS === "ios" ? (
            <PlatformActivityIndicator size={"large"} color="white" />
          ) : (
            <RotateableLoading />
          )}
        </View>
        {showCancelButton && (
          <View className="absolute inset-x-0 bottom-24 flex-row justify-center">
            <TouchableOpacity onPress={cancel}>
              <View className="border-opaque-separator rounded-full border-2 p-2">
                <CloseCuteReIcon color="gray" height={20} width={20} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </Pressable>
    </FullWindowOverlay>
  )
}
