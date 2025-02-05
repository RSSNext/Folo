import { noop } from "es-toolkit/compat"
import { router } from "expo-router"
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react"
import { TouchableWithoutFeedback, View } from "react-native"
import BouncyCheckbox from "react-native-bouncy-checkbox"
import { KeyboardController } from "react-native-keyboard-controller"
import Animated, {
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"

import { ThemedText } from "@/src/components/common/ThemedText"
import { ContextMenu } from "@/src/components/ui/context-menu"
import { Logo } from "@/src/components/ui/logo"
import {
  LoginTeamsCheckedContext,
  LoginTeamsCheckGuardContext,
} from "@/src/contexts/LoginTeamsContext"
import { isIOS } from "@/src/lib/platform"
import { toast } from "@/src/lib/toast"
import { TeamsMarkdown } from "@/src/screens/(headless)/terms"

import { EmailLogin } from "./email"
import { SocialLogin } from "./social"

export function Login() {
  const [isChecked, setIsChecked] = useState(false)

  const teamsCheckBoxRef = useRef<{ shake: () => void }>(null)
  return (
    <LoginTeamsCheckedContext.Provider value={isChecked}>
      <LoginTeamsCheckGuardContext.Provider
        value={useCallback(
          (callback: () => void) => {
            if (isChecked) {
              callback()
            } else {
              toast.info("Please accept the Terms of Service and Privacy Policy")

              teamsCheckBoxRef.current?.shake()
            }
          },
          [isChecked],
        )}
      >
        <View className="flex-1 p-safe">
          <TouchableWithoutFeedback
            onPress={() => {
              KeyboardController.dismiss()
            }}
            accessible={false}
          >
            <View className="flex-1 items-center gap-8 pt-20">
              <Logo style={{ width: 80, height: 80 }} />
              <ThemedText className="text-2xl font-bold">Login to Follow</ThemedText>
              <EmailLogin />
            </View>
          </TouchableWithoutFeedback>
          <TeamsCheckBox ref={teamsCheckBoxRef} isChecked={isChecked} setIsChecked={setIsChecked} />
          <View className="border-t-opaque-separator border-t-hairline mx-28" />
          <View className="mt-2 items-center">
            <View className="mb-4 flex w-full max-w-sm flex-row items-center gap-4">
              <View className="bg-separator my-4 h-[0.5px] flex-1" />
              <ThemedText className="text-secondary-label text-lg">or</ThemedText>
              <View className="bg-separator my-4 h-[0.5px] flex-1" />
            </View>
            <SocialLogin />
          </View>
        </View>
      </LoginTeamsCheckGuardContext.Provider>
    </LoginTeamsCheckedContext.Provider>
  )
}

const TeamsCheckBox = forwardRef<
  { shake: () => void },
  {
    isChecked: boolean
    setIsChecked: (isChecked: boolean) => void
  }
>(({ isChecked, setIsChecked }, ref) => {
  const shakeSharedValue = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeSharedValue.value }],
  }))
  useImperativeHandle(ref, () => ({
    shake: () => {
      const animations = [-10, 10, -8, 8, -6, 6, 0]

      runOnUI(() => {
        "worklet"
        shakeSharedValue.value = 0

        const runAnimation = (index: number) => {
          "worklet"
          if (index < animations.length) {
            shakeSharedValue.value = withTiming(animations[index]!, { duration: 100 }, () => {
              runAnimation(index + 1)
            })
          }
        }

        runAnimation(0)
      })()
    },
  }))
  return (
    <Animated.View className="mb-4 flex-row items-center gap-2 px-8" style={shakeStyle}>
      <BouncyCheckbox
        isChecked={isChecked}
        onPress={setIsChecked}
        size={14}
        textComponent={<TeamsText />}
        onLongPress={() => {
          if (!isIOS) {
            router.push("/terms")
          }
        }}
      />
    </Animated.View>
  )
})

const TeamsText = () => {
  return (
    <ContextMenu
      className="overflow-hidden rounded-full px-2"
      config={{ items: [] }}
      onPressMenuItem={noop}
      onPressPreview={() => {
        router.push("/terms")
      }}
      renderPreview={() => (
        <View className="flex-1">
          <TeamsMarkdown />
        </View>
      )}
    >
      <ThemedText className="text-secondary-label text-sm">
        I agree to the Terms of Service and Privacy Policy
      </ThemedText>
    </ContextMenu>
  )
}
