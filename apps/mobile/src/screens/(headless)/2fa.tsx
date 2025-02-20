import { useMutation } from "@tanstack/react-query"
import { router } from "expo-router"
import { useMemo, useState } from "react"
import {
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useAnimatedValue,
  View,
} from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"
import { useColor } from "react-native-uikit-colors"

import {
  NavigationBlurEffectHeader,
  NavigationContext,
} from "@/src/components/common/SafeNavigationScrollView"
import { MingcuteLeftLineIcon } from "@/src/icons/mingcute_left_line"
import { twoFactor } from "@/src/lib/auth"
import { toast } from "@/src/lib/toast"

function isAuthCodeValid(authCode: string) {
  return (
    authCode.length === 6 && !Array.from(authCode).some((c) => Number.isNaN(Number.parseInt(c)))
  )
}

export default function TwoFactorAuthScreen() {
  const scrollY = useAnimatedValue(0)
  const label = useColor("label")
  const [authCode, setAuthCode] = useState("")

  const submitMutation = useMutation({
    mutationFn: (value: string) =>
      twoFactor.verifyTotp({ code: value }).then((res) => {
        if (res.error) {
          throw new Error(res.error.message)
        }
      }),
    onError(error) {
      toast.error(`Failed to verify: ${error.message}`)
      setAuthCode("")
    },
    onSuccess() {
      router.replace("/")
    },
  })

  return (
    <NavigationContext.Provider value={useMemo(() => ({ scrollY }), [scrollY])}>
      <View className="flex-1 p-safe">
        <NavigationBlurEffectHeader
          headerShown
          headerTitle=""
          headerLeft={() => {
            return (
              <TouchableOpacity onPress={() => router.back()}>
                <MingcuteLeftLineIcon color={label} />
              </TouchableOpacity>
            )
          }}
        />
        <TouchableWithoutFeedback
          onPress={() => {
            KeyboardController.dismiss()
          }}
          accessible={false}
        >
          <View className="mt-20 flex-1">
            <View className="flex-row items-center justify-center">
              <Text className="text-label w-72 text-center text-3xl font-bold" numberOfLines={2}>
                Verify with your authenticator app
              </Text>
            </View>

            <View className="mx-5 mt-10">
              <Text className="text-label">Enter Follow Auth Code</Text>
              <View className="bg-secondary-system-background mt-2 rounded-lg p-4">
                <TextInput
                  placeholder="6-digit authentication code"
                  autoComplete="one-time-code"
                  keyboardType="numeric"
                  className="text-text"
                  value={authCode}
                  onChangeText={setAuthCode}
                />
              </View>
            </View>

            <TouchableOpacity
              className="disabled:bg-gray-3 mx-5 mt-10 rounded-lg bg-accent p-4"
              disabled={submitMutation.isPending || !isAuthCodeValid(authCode)}
              onPress={() => {
                submitMutation.mutate(authCode)
              }}
            >
              <Text className="text-label text-center">Submit</Text>
            </TouchableOpacity>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </NavigationContext.Provider>
  )
}
