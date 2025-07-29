import { tracker } from "@follow/tracker"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useCallback, useRef } from "react"
import type { Control } from "react-hook-form"
import { useController, useForm } from "react-hook-form"
import type { TextInputProps } from "react-native"
import { Alert, TouchableOpacity, View } from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"
import { z } from "zod"

import { useServerConfigs } from "@/src/atoms/server-configs"
import { SubmitButton } from "@/src/components/common/SubmitButton"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import { Text } from "@/src/components/ui/typography/Text"
import { signIn, signUp } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { Navigation } from "@/src/lib/navigation/Navigation"
import { toast } from "@/src/lib/toast"
import { getTokenHeaders } from "@/src/lib/token"
import { ForgetPasswordScreen } from "@/src/screens/(modal)/ForgetPasswordScreen"
import { TwoFactorAuthScreen } from "@/src/screens/(modal)/TwoFactorAuthScreen"
import { accentColor } from "@/src/theme/colors"

import { ReferralForm } from "./referral"

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

      <TouchableOpacity
        className="mx-auto my-5"
        onPress={() => navigation.presentControllerView(ForgetPasswordScreen)}
      >
        <Text className="text-secondary-label text-sm">Forgot password?</Text>
      </TouchableOpacity>
      <SubmitButton isLoading={submitMutation.isPending} onPress={onLogin} title="Continue" />
    </View>
  )
}

// Signup

const signupFormSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
type SignupFormValue = z.infer<typeof signupFormSchema>
function SignupInput({
  control,
  name,
  ...rest
}: TextInputProps & {
  control: Control<SignupFormValue>
  name: keyof SignupFormValue
}) {
  const { field } = useController({
    control,
    name,
  })
  return (
    <PlainTextField
      selectionColor={accentColor}
      {...rest}
      value={field.value}
      onChangeText={field.onChange}
    />
  )
}
export function EmailSignUp() {
  const serverConfigs = useServerConfigs()
  const { control, handleSubmit, formState } = useForm<SignupFormValue>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })
  const submitMutation = useMutation({
    mutationFn: async (values: SignupFormValue) => {
      await signUp
        .email(
          {
            email: values.email,
            password: values.password,
            name: values.email.split("@")[0] ?? "",
          },
          {
            headers: await getTokenHeaders(),
          },
        )
        .then((res) => {
          if (res.error?.message) {
            toast.error(res.error.message)
          } else {
            toast.success("Sign up successful")
            tracker.register({
              type: "email",
            })
            Navigation.rootNavigation.back()
          }
        })
    },
  })
  const signup = handleSubmit((values) => {
    submitMutation.mutate(values)
  })
  return (
    <View className="mx-auto flex w-full max-w-sm">
      <View className="bg-secondary-system-background gap-4 rounded-2xl px-6 py-4">
        <View className="flex-row">
          <SignupInput
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            control={control}
            name="email"
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
          <SignupInput
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            control={control}
            name="password"
            placeholder="Password"
            className="text-text flex-1"
            secureTextEntry
            returnKeyType="next"
          />
        </View>
        <View className="border-b-opaque-separator border-b-hairline" />
        <View className="flex-row">
          <SignupInput
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            control={control}
            name="confirmPassword"
            placeholder="Confirm Password"
            className="text-text flex-1"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={() => {
              signup()
            }}
          />
        </View>
        {serverConfigs?.REFERRAL_ENABLED && (
          <>
            <View className="border-b-opaque-separator border-b-hairline" />
            <ReferralForm />
          </>
        )}
      </View>
      <SubmitButton
        disabled={submitMutation.isPending || !formState.isValid}
        isLoading={submitMutation.isPending}
        onPress={signup}
        title="Continue"
        className="mt-8"
      />
    </View>
  )
}
