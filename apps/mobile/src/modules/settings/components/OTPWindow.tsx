import { useMutation } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import {
  Animated,
  Keyboard,
  StyleSheet,
  useAnimatedValue,
  useWindowDimensions,
  View,
} from "react-native"
import type { OtpInputRef } from "react-native-otp-entry"
import { OtpInput } from "react-native-otp-entry"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useColor } from "react-native-uikit-colors"
import { useEventCallback } from "usehooks-ts"

import { FullWindowOverlay } from "@/src/components/common/FullWindowOverlay"
import { Text } from "@/src/components/ui/typography/Text"
import { isAuthCodeValid } from "@/src/lib/auth"
import { toast } from "@/src/lib/toast"
import { accentColor } from "@/src/theme/colors"

type OTPWindowProps<T> = {
  onSuccess: (data: T) => void
  verifyFn: (code: string) => Promise<T>
  onDismiss: () => void
}
export const OTPWindow = <T,>({ onSuccess, verifyFn, onDismiss }: OTPWindowProps<T>) => {
  const otpInputRef = useRef<OtpInputRef>(null)
  const label = useColor("label")
  const tertiaryLabel = useColor("tertiaryLabel")
  const secondaryBackground = useColor("gray5")
  const tertiaryBackground = useColor("gray6")
  const submitMutation = useMutation({
    onError(error) {
      toast.error(`Failed to verify: ${error.message}`)
    },
    onSuccess(data) {
      onSuccess(data)
    },
    onSettled() {
      setComponentRender(false)
    },
    mutationFn: ({ code }: { code: string }) => verifyFn(code),
  })
  const windowScale = useAnimatedValue(1.1)
  const windowOpacity = useAnimatedValue(0)
  const [uiShow, setUiShow] = useState(false)
  const [componentRender, setComponentRender] = useState(true)
  useEffect(() => {
    setUiShow(true)
  }, [])
  const stableDismiss = useEventCallback(() => {
    onDismiss()
  })
  useEffect(() => {
    let timer: any
    if (uiShow) {
      Animated.parallel([
        Animated.spring(windowScale, {
          toValue: 1,
          damping: 80,
          stiffness: 500,
          mass: 1,
          velocity: 10,
          useNativeDriver: true,
        }),
        Animated.timing(windowOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()
    } else {
      Animated.timing(windowOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start()
      timer = setTimeout(() => {
        setComponentRender(false)
        stableDismiss()
      }, 500)
    }
    return () => clearTimeout(timer)
  }, [stableDismiss, uiShow, windowOpacity, windowScale])
  const { height } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [nextHeight, setNextHeight] = useState(height - insets.top)
  useEffect(() => {
    const sub = [
      Keyboard.addListener("keyboardDidShow", () => {
        const metrics = Keyboard.metrics()
        if (!metrics) return
        setNextHeight(height - metrics.height)
      }),
      Keyboard.addListener("keyboardWillHide", () => {
        setNextHeight(height - insets.top)
      }),
    ]
    return () => sub.forEach((listener) => listener.remove())
  }, [height, insets.top])
  if (!componentRender) return null
  return (
    <FullWindowOverlay>
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            opacity: windowOpacity,
          },
        ]}
      >
        <View className={"flex-1 bg-black/50"} />
      </Animated.View>
      <View className={"flex-1"}>
        {/* Window */}

        <View
          style={{
            height: nextHeight,
          }}
          className="pt-safe items-center justify-center"
        >
          <Animated.View
            className="bg-system-background mx-5 overflow-hidden rounded-3xl"
            style={[
              styles.window,
              {
                transform: [
                  {
                    scale: windowScale,
                  },
                ],
                opacity: windowOpacity,
              },
            ]}
          >
            <View className="px-6 pb-1 pt-6">
              <Text className="text-label mb-1 text-center text-lg font-medium">
                Verification Required
              </Text>
              <Text className="text-secondary-label text-center text-base">
                Please enter the code from your authenticator app.
              </Text>
            </View>

            <View className="px-4 py-5">
              <OtpInput
                disabled={submitMutation.isPending}
                ref={otpInputRef}
                numberOfDigits={6}
                autoFocus
                focusColor={"#00000000"}
                theme={{
                  containerStyle: {
                    marginVertical: 8,
                  },
                  pinCodeTextStyle: {
                    color: label,
                    fontSize: 22,
                    fontWeight: "500",
                  },
                  placeholderTextStyle: {
                    color: tertiaryLabel,
                  },
                  filledPinCodeContainerStyle: {
                    borderColor: "transparent",
                    backgroundColor: secondaryBackground,
                  },
                  pinCodeContainerStyle: {
                    borderColor: "transparent",
                    backgroundColor: tertiaryBackground,
                    borderRadius: 12,
                    aspectRatio: 1,
                    width: 45,
                    marginHorizontal: 4,
                  },
                  focusedPinCodeContainerStyle: {
                    borderColor: accentColor,
                    borderWidth: 2,
                  },
                }}
                onFilled={(code) => {
                  if (isAuthCodeValid(code)) {
                    submitMutation.mutate({
                      code,
                    })
                  }
                }}
              />
            </View>

            <View className="border-non-opaque-separator border-t-hairline flex-row px-4 py-2">
              <View className="flex-1 items-center">
                <Text
                  className="text-accent px-5 py-2 text-base font-medium"
                  onPress={() => {
                    setUiShow(false)
                  }}
                  suppressHighlighting
                >
                  Cancel
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </FullWindowOverlay>
  )
}
const styles = StyleSheet.create({
  window: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    maxWidth: 400,
  },
})
