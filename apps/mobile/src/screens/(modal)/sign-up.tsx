import { tracker } from "@follow/tracker"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import type { Control } from "react-hook-form"
import { useController, useForm } from "react-hook-form"
import type { TextInputProps } from "react-native"
import { Text, TouchableWithoutFeedback, View } from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"
import { z } from "zod"

import { SubmitButton } from "@/src/components/common/SubmitButton"
import { HeaderCloseOnly } from "@/src/components/layouts/header/HeaderElements"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import { Logo } from "@/src/components/ui/logo"
import { signUp } from "@/src/lib/auth"
import { Navigation } from "@/src/lib/navigation/Navigation"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useScaleHeight } from "@/src/lib/responsive"
import { toast } from "@/src/lib/toast"
import { getTokenHeaders } from "@/src/lib/token"
import { accentColor } from "@/src/theme/colors"

const formSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type FormValue = z.infer<typeof formSchema>

async function onSubmit(values: FormValue) {
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
        tracker.register({ type: "email" })
        Navigation.rootNavigation.back()
      }
    })
}

function Input({
  control,
  name,
  ...rest
}: TextInputProps & {
  control: Control<FormValue>
  name: keyof FormValue
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

function EmailSignUp() {
  const { control, handleSubmit, formState } = useForm<FormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const submitMutation = useMutation({
    mutationFn: onSubmit,
  })

  const signup = handleSubmit((values) => {
    submitMutation.mutate(values)
  })

  return (
    <View className="mx-auto flex w-full max-w-sm">
      <View className="bg-secondary-system-background gap-4 rounded-2xl px-6 py-4">
        <View className="flex-row">
          <Input
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
          <Input
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
          <Input
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

export const SignUpScreen: NavigationControllerView = () => {
  const scaledHeight = useScaleHeight()
  const logoSize = scaledHeight(80)
  const gapSize = scaledHeight(28)
  const fontSize = scaledHeight(28)
  const lineHeight = scaledHeight(32)
  return (
    <View className="p-safe flex-1">
      <HeaderCloseOnly />
      <TouchableWithoutFeedback
        onPress={() => {
          KeyboardController.dismiss()
        }}
        accessible={false}
      >
        <View
          className="flex-1 items-center"
          style={{
            gap: gapSize,
          }}
        >
          <Logo style={{ width: logoSize, height: logoSize }} />
          <Text
            className="text-label"
            style={{
              fontSize,
              lineHeight,
            }}
          >
            Sign up to <Text className="font-bold">Folo</Text>
          </Text>
          <EmailSignUp />
        </View>
      </TouchableWithoutFeedback>
    </View>
  )
}
