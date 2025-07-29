import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { TouchableWithoutFeedback, View } from "react-native"
import { KeyboardAvoidingView, KeyboardController } from "react-native-keyboard-controller"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { SubmitButton } from "@/src/components/common/SubmitButton"
import { HeaderCloseOnly } from "@/src/components/layouts/header/HeaderElements"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import { Text } from "@/src/components/ui/typography/Text"
import { forgetPassword } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { getTokenHeaders } from "@/src/lib/token"

export const ForgetPasswordScreen: NavigationControllerView = () => {
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState("")
  const navigation = useNavigation()
  const forgetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await forgetPassword(
        {
          email,
        },
        {
          headers: await getTokenHeaders(),
        },
      )
      if (res.error) {
        throw new Error(res.error.message)
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: () => {
      toast.success("We have sent you an email with instructions to reset your password.")
      navigation.back()
    },
  })
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        KeyboardController.dismiss()
      }}
      accessible={false}
    >
      <KeyboardAvoidingView
        behavior="padding"
        style={{
          flex: 1,
        }}
      >
        <HeaderCloseOnly />
        <View
          className="flex-1 justify-between px-5"
          style={{
            paddingTop: insets.bottom + 56,
          }}
        >
          <View className="items-center">
            <Text className="text-text text-center text-4xl font-bold">Forgot password?</Text>
            <Text className="text-text mx-10 mt-6 text-center text-lg">
              Enter your email address that you use with your account to continue.
            </Text>

            <View className="bg-secondary-system-background mt-6 gap-4 self-stretch rounded-2xl px-6 py-4">
              <View className="flex-row">
                <PlainTextField
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  placeholder="Email"
                  className="text-text flex-1"
                  value={email}
                  onChangeText={setEmail}
                  onSubmitEditing={() => forgetPasswordMutation.mutate(email)}
                />
              </View>
            </View>
          </View>

          <SubmitButton
            title="Continue"
            className="self-stretch"
            style={{
              bottom: insets.bottom + 30,
            }}
            disabled={!email || forgetPasswordMutation.isPending}
            isLoading={forgetPasswordMutation.isPending}
            onPress={() => forgetPasswordMutation.mutate(email)}
          />
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}
