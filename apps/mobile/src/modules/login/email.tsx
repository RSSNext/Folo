import { tracker } from "@follow/tracker"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import i18next from "i18next"
import { useCallback, useRef } from "react"
import type { Control } from "react-hook-form"
import { useController, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import type { TextInputProps } from "react-native"
import { Alert, Pressable, View } from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"
import { z } from "zod"

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

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})
type FormValue = z.infer<typeof formSchema>
async function onSubmit(values: FormValue) {
  const result = formSchema.safeParse(values)
  if (!result.success) {
    const issue = result.error.issues[0]
    Alert.alert(i18next.t("login.invalid_email_or_password"), issue?.message)
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
  const { t } = useTranslation()
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
      <View className="gap-4 rounded-2xl bg-secondary-system-background px-6 py-4">
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
            placeholder={t("login.email")}
            className="flex-1 text-text"
            returnKeyType="next"
            onSubmitEditing={() => {
              KeyboardController.setFocusTo("next")
            }}
          />
        </View>
        <View className="border-b-hairline border-b-opaque-separator" />
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
            placeholder={t("login.password")}
            className="flex-1 text-text"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={onLogin}
          />
        </View>
      </View>

      <Pressable
        className="mx-auto my-5"
        onPress={() => navigation.presentControllerView(ForgetPasswordScreen)}
      >
        <Text className="text-sm text-secondary-label">{t("login.forget_password.note")}</Text>
      </Pressable>
      <SubmitButton
        isLoading={submitMutation.isPending}
        onPress={onLogin}
        title={t("login.submit")}
      />
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
    message: i18next.t("login.passwords_do_not_match"),
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
  const { t } = useTranslation()
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
            toast.success(i18next.t("login.sign_up_successful"))
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
      <View className="gap-4 rounded-2xl bg-secondary-system-background px-6 py-4">
        <View className="flex-row">
          <SignupInput
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            control={control}
            name="email"
            placeholder={t("login.email")}
            className="flex-1 text-text"
            returnKeyType="next"
            onSubmitEditing={() => {
              KeyboardController.setFocusTo("next")
            }}
          />
        </View>
        <View className="border-b-hairline border-b-opaque-separator" />
        <View className="flex-row">
          <SignupInput
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            control={control}
            name="password"
            placeholder={t("login.password")}
            className="flex-1 text-text"
            secureTextEntry
            returnKeyType="next"
          />
        </View>
        <View className="border-b-hairline border-b-opaque-separator" />
        <View className="flex-row">
          <SignupInput
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            control={control}
            name="confirmPassword"
            placeholder={t("login.confirm_password.label")}
            className="flex-1 text-text"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={() => {
              signup()
            }}
          />
        </View>
      </View>
      <SubmitButton
        disabled={submitMutation.isPending || !formState.isValid}
        isLoading={submitMutation.isPending}
        onPress={signup}
        title={t("login.submit")}
        className="mt-8"
      />
    </View>
  )
}
