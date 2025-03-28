import { tracker } from "@follow/tracker"
import { useMutation } from "@tanstack/react-query"
import { useCallback, useRef } from "react"
import { Alert, Text, TouchableOpacity, View } from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"
import { z } from "zod"

import { SubmitButton } from "@/src/components/common/SubmitButton"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import { signIn } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { Navigation } from "@/src/lib/navigation/Navigation"
import { getTokenHeaders } from "@/src/lib/token"
import { TwoFactorAuthScreen } from "@/src/screens/(modal)/2fa"
import { ForgetPasswordScreen } from "@/src/screens/(modal)/forget-password"
import { SignUpScreen } from "@/src/screens/(modal)/sign-up"
import { accentColor } from "@/src/theme/colors"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

type FormValue = z.infer<typeof formSchema>

async function onSubmit(values: FormValue) {
  const result = formSchema.safeParse(values)
  if (!result.success) {
    const issue = result.error.issues[0]
    Alert.alert("Invalid email or password", issue?.message)
    return
  }

  await signIn
    .email(
      {
        email: result.data.email,
        password: result.data.password,
      },
      {
        headers: await getTokenHeaders(),
      },
    )
    .then((res) => {
      if (res.error) {
        throw new Error(res.error.message)
      }
      // @ts-expect-error
      if (res.data.twoFactorRedirect) {
        Navigation.rootNavigation.presentControllerView(TwoFactorAuthScreen)
      }
    })
    .catch((error) => {
      Alert.alert(error.message)
    })

  tracker.userLogin({
    type: "email",
  })
}

export function EmailLogin() {
  const emailValueRef = useRef("")
  const passwordValueRef = useRef("")

  const submitMutation = useMutation({
    mutationFn: onSubmit,
  })

  const onLogin = useCallback(() => {
    submitMutation.mutate({
      email: emailValueRef.current,
      password: passwordValueRef.current,
    })
  }, [submitMutation])

  const navigation = useNavigation()
  return (
    <View className="mx-auto flex w-full max-w-sm">
      <View className="bg-secondary-system-background gap-4 rounded-2xl px-6 py-4">
        <View className="flex-row">
          <PlainTextField
            onChangeText={(text) => {
              emailValueRef.current = text
            }}
            selectionColor={accentColor}
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            placeholder="Email"
            className="text-text flex-1"
            returnKeyType="next"
            onSubmitEditing={() => {
              KeyboardController.setFocusTo("next")
            }}
          />
        </View>
        <View className="border-b-opaque-separator border-b-hairline" />
        <View className="flex-row">
          <PlainTextField
            onChangeText={(text) => {
              passwordValueRef.current = text
            }}
            selectionColor={accentColor}
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            placeholder="Password"
            className="text-text flex-1"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={onLogin}
          />
        </View>
      </View>

      <SubmitButton
        isLoading={submitMutation.isPending}
        onPress={onLogin}
        title="Continue"
        className="mt-8"
      />
      <TouchableOpacity
        className="mx-auto mt-10"
        onPress={() => navigation.presentControllerView(SignUpScreen)}
      >
        <Text className="text-accent m-1 text-[15px]">Don't have an account?</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="mx-auto mt-4"
        onPress={() => navigation.presentControllerView(ForgetPasswordScreen)}
      >
        <Text className="text-secondary-label m-[6] text-[15px]">Forgot password?</Text>
      </TouchableOpacity>
    </View>
  )
}
