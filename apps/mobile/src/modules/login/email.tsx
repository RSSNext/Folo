import { userSyncService } from "@follow/store/user/store"
import { tracker } from "@follow/tracker"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import i18next from "i18next"
import { useCallback, useState } from "react"
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
import { authClient, persistAuthCookieHeader } from "@/src/lib/auth"
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

const getAuthErrorMessage = (value: unknown) => {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return
  }

  const { error } = value
  if (!error || typeof error !== "object" || !("message" in error)) {
    return
  }

  return typeof error.message === "string" ? error.message : undefined
}

const getAuthData = (value: unknown) => {
  if (!value || typeof value !== "object" || !("data" in value)) {
    return
  }

  return value.data && typeof value.data === "object" ? value.data : undefined
}

const getResponseSetCookie = (response: Response) => {
  const directValue =
    response.headers.get("x-better-auth-set-cookie") ??
    response.headers.get("set-cookie") ??
    response.headers.get("Set-Cookie")
  if (directValue) {
    return directValue
  }

  const rawHeaders = (response as Response & { _rawHeaders?: unknown })._rawHeaders
  if (!Array.isArray(rawHeaders)) {
    return null
  }

  const values = rawHeaders
    .filter(
      (header): header is [string, string] =>
        Array.isArray(header) &&
        header.length >= 2 &&
        typeof header[0] === "string" &&
        typeof header[1] === "string",
    )
    .filter(([key]) => key.toLowerCase() === "set-cookie")
    .map(([, value]) => value)

  return values.length > 0 ? values.join(", ") : null
}

const hasTwoFactorRedirect = (value: unknown) => {
  const data = getAuthData(value)
  if (data && "twoFactorRedirect" in data) {
    return Boolean(data.twoFactorRedirect)
  }

  if (!value || typeof value !== "object" || !("response" in value)) {
    return false
  }

  const { response } = value
  if (!response || typeof response !== "object" || !("twoFactorRedirect" in response)) {
    return false
  }

  return Boolean(response.twoFactorRedirect)
}

const requestCredentialAuth = async ({
  path,
  body,
}: {
  path: "/sign-in/email" | "/sign-up/email"
  body: Record<string, string>
}) => {
  let setCookie: string | null = null

  const result = await authClient.$fetch(path, {
    method: "POST",
    body,
    headers: await getTokenHeaders(),
    throw: false,
    onResponse(context) {
      setCookie = getResponseSetCookie(context.response)
    },
  })

  const persistedCookie = setCookie ? persistAuthCookieHeader(setCookie) : false

  return {
    result,
    persistedCookie,
  }
}

const establishCredentialSession = async ({
  email,
  password,
  onTwoFactorRedirect,
}: {
  email: string
  password: string
  onTwoFactorRedirect?: () => void
}) => {
  const { result, persistedCookie } = await requestCredentialAuth({
    path: "/sign-in/email",
    body: {
      email,
      password,
    },
  })

  const errorMessage = getAuthErrorMessage(result)
  if (errorMessage) {
    throw new Error(errorMessage)
  }

  if (hasTwoFactorRedirect(result)) {
    onTwoFactorRedirect?.()
    return null
  }

  const session = persistedCookie ? await userSyncService.whoami().catch(() => null) : null
  if (!session?.user?.id) {
    return null
  }

  return session
}
async function onSubmit(values: FormValue) {
  const result = formSchema.safeParse(values)
  if (!result.success) {
    const issue = result.error.issues[0]
    Alert.alert(i18next.t("login.invalid_email_or_password"), issue?.message)
    return false
  }

  let session = null
  try {
    session = await establishCredentialSession({
      email: result.data.email,
      password: result.data.password,
      onTwoFactorRedirect: () => {
        Navigation.rootNavigation.presentControllerView(TwoFactorAuthScreen)
      },
    })
  } catch (error) {
    Alert.alert(error instanceof Error ? error.message : "Unable to sign in")
    return false
  }

  if (!session?.user?.id) {
    return false
  }

  tracker.userLogin({
    type: "email",
  })
  return true
}
export function EmailLogin() {
  const { t } = useTranslation()
  const [emailValue, setEmailValue] = useState("")
  const [passwordValue, setPasswordValue] = useState("")
  const submitMutation = useMutation({
    mutationFn: onSubmit,
  })
  const onLogin = useCallback(() => {
    submitMutation.mutate({
      email: emailValue,
      password: passwordValue,
    })
  }, [emailValue, passwordValue, submitMutation])
  const navigation = useNavigation()

  return (
    <View className="mx-auto flex w-full max-w-sm">
      <View className="gap-4 rounded-2xl bg-secondary-system-background px-6 py-4">
        <View className="flex-row">
          <PlainTextField
            testID="login-email-input"
            value={emailValue}
            onChangeText={setEmailValue}
            selectionColor={accentColor}
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            importantForAutofill="auto"
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
            testID="login-password-input"
            value={passwordValue}
            onChangeText={setPasswordValue}
            selectionColor={accentColor}
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            importantForAutofill="auto"
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
        testID="login-submit"
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
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })
  const submitMutation = useMutation({
    mutationFn: async (values: SignupFormValue) => {
      try {
        const { result, persistedCookie } = await requestCredentialAuth({
          path: "/sign-up/email",
          body: {
            email: values.email,
            password: values.password,
            name: values.email.split("@")[0] ?? "",
          },
        })

        const errorMessage = getAuthErrorMessage(result)
        if (errorMessage) {
          toast.error(errorMessage)
          return false
        }

        let session = persistedCookie ? await userSyncService.whoami().catch(() => null) : null
        if (!session?.user?.id) {
          session = await establishCredentialSession({
            email: values.email,
            password: values.password,
          })
        }

        if (!session?.user?.id) {
          toast.error("Unable to establish session after sign up")
          return false
        }

        toast.success(i18next.t("login.sign_up_successful"))
        tracker.register({
          type: "email",
        })
        return true
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to sign up")
        return false
      }
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
            testID="register-email-input"
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            importantForAutofill="auto"
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
            testID="register-password-input"
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            textContentType="newPassword"
            importantForAutofill="auto"
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
            testID="register-confirm-password-input"
            hitSlop={20}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            textContentType="newPassword"
            importantForAutofill="auto"
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
        testID="register-submit"
        onPress={signup}
        title={t("login.submit")}
        className="mt-8"
      />
    </View>
  )
}
