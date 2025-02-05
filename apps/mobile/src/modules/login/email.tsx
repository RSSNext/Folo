import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useContext, useEffect } from "react"
import type { Control } from "react-hook-form"
import { useController, useForm } from "react-hook-form"
import type { TextInputProps } from "react-native"
import { ActivityIndicator, TextInput, View } from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"
import {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated"
import { z } from "zod"

import { ReAnimatedPressable } from "@/src/components/common/AnimatedComponents"
import { ThemedText } from "@/src/components/common/ThemedText"
import { LoginTeamsCheckGuardContext } from "@/src/contexts/LoginTeamsContext"
import { signIn } from "@/src/lib/auth"
import { toast } from "@/src/lib/toast"
import { accentColor, useColor } from "@/src/theme/colors"

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

type FormValue = z.infer<typeof formSchema>

async function onSubmit(values: FormValue) {
  await signIn
    .email({
      email: values.email,
      password: values.password,
    })
    .catch((error) => {
      console.error(error)
      toast.error("Login failed")
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
    <TextInput
      selectionColor={accentColor}
      {...rest}
      value={field.value}
      onChangeText={field.onChange}
    />
  )
}

export function EmailLogin() {
  const { control, handleSubmit, formState } = useForm<FormValue>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const submitMutation = useMutation({
    mutationFn: onSubmit,
  })

  const teamsCheckGuard = useContext(LoginTeamsCheckGuardContext)
  const login = handleSubmit((values) => {
    teamsCheckGuard?.(() => submitMutation.mutate(values))
  })

  const disableColor = useColor("gray3")

  const canLogin = useSharedValue(0)
  useEffect(() => {
    canLogin.value = withTiming(submitMutation.isPending || !formState.isValid ? 1 : 0)
  }, [submitMutation.isPending, formState.isValid, canLogin])
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: interpolate(canLogin.value, [0, 1], [1, 0.5]),
    backgroundColor: interpolateColor(canLogin.value, [1, 0], [disableColor, accentColor]),
  }))

  return (
    <View className="mx-auto flex w-full max-w-sm gap-6">
      <View className="gap-4">
        <View className="flex-row">
          <ThemedText className="w-28">Account</ThemedText>
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            control={control}
            name="email"
            placeholder="Email"
            className="placeholder:font-sn text-text flex-1"
            returnKeyType="next"
            onSubmitEditing={() => {
              KeyboardController.setFocusTo("next")
            }}
          />
        </View>
        <View className="border-b-opaque-separator border-b-hairline ml-28" />
        <View className="flex-row">
          <ThemedText className="w-28">Password</ThemedText>
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            control={control}
            name="password"
            placeholder="Enter password"
            className="placeholder:font-sn text-text flex-1"
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={() => {
              login()
            }}
          />
        </View>
      </View>
      <ReAnimatedPressable
        disabled={submitMutation.isPending || !formState.isValid}
        onPress={login}
        className="mt-8 h-10 flex-row items-center justify-center rounded-3xl"
        style={buttonStyle}
      >
        {submitMutation.isPending ? (
          <ActivityIndicator className="text-white" />
        ) : (
          <ThemedText className="text-center font-semibold text-white">Continue</ThemedText>
        )}
      </ReAnimatedPressable>
    </View>
  )
}
