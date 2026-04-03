import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ScrollView, StyleSheet, View } from "react-native"
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
  const { t } = useTranslation()
  const [email, setEmail] = useState("")
  const navigation = useNavigation()
  const contentContainerStyle = {
    flexGrow: 1,
    justifyContent: "space-between" as const,
    paddingTop: insets.top + 56,
    paddingBottom: insets.bottom + 24,
  }
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
      toast.success(t("login.forgot_password.success"))
      navigation.back()
    },
  })
  return (
    <KeyboardAvoidingView behavior="padding" style={styles.keyboardContainer}>
      <HeaderCloseOnly />
      <ScrollView
        className="flex-1 px-5"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={contentContainerStyle}
        onScrollBeginDrag={() => {
          KeyboardController.dismiss()
        }}
      >
        <View className="items-center">
          <Text className="text-center text-4xl font-bold text-text">
            {t("login.forgot_password.title")}
          </Text>
          <Text className="mx-10 mt-6 text-center text-lg text-text">
            {t("login.forgot_password.description")}
          </Text>

          <View className="mt-6 gap-4 self-stretch rounded-2xl bg-secondary-system-background px-6 py-4">
            <View className="flex-row">
              <PlainTextField
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                placeholder={t("login.email")}
                className="flex-1 text-text"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={() => forgetPasswordMutation.mutate(email)}
              />
            </View>
          </View>
        </View>

        <SubmitButton
          title={t("login.forgot_password.continue")}
          className="mt-8 self-stretch"
          disabled={!email || forgetPasswordMutation.isPending}
          isLoading={forgetPasswordMutation.isPending}
          onPress={() => forgetPasswordMutation.mutate(email)}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
})
