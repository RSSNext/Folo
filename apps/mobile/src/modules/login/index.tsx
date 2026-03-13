import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Linking, Pressable, ScrollView, View } from "react-native"
import { KeyboardAvoidingView } from "react-native-keyboard-controller"
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { Logo } from "@/src/components/ui/logo"
import { Text } from "@/src/components/ui/typography/Text"
import { useScaleHeight } from "@/src/lib/responsive"

import { EmailLogin, EmailSignUp } from "./email"
import { SocialLogin } from "./social"

export function Login() {
  const insets = useSafeAreaInsets()
  const scaledHeight = useScaleHeight()
  const logoSize = scaledHeight(80)
  const gapSize = scaledHeight(28)
  const fontSize = scaledHeight(28)
  const lineHeight = scaledHeight(32)
  const { t } = useTranslation()
  const [isRegister, setIsRegister] = useState(true)
  const [isEmail, setIsEmail] = useState(false)
  const contentContainerStyle = {
    flexGrow: 1,
    paddingTop: insets.top + 56,
    paddingBottom: insets.bottom + 24,
  }
  return (
    <View testID="login-screen" className="flex-1">
      <KeyboardAvoidingView behavior={"position"} className="flex-1">
        <ScrollView
          className="flex-1"
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={contentContainerStyle}
        >
          <View className="flex-1 justify-between px-6">
            <View
              className="items-center"
              style={{
                gap: gapSize,
              }}
            >
              <Logo
                style={{
                  width: logoSize,
                  height: logoSize,
                }}
              />
              <Text
                style={{
                  fontSize,
                  lineHeight,
                }}
              >
                <Text className="text-3xl font-semibold">{`${isRegister ? t("signin.sign_up_to") : t("signin.sign_in_to")} `}</Text>
                <Text className="text-3xl font-bold">Folo</Text>
              </Text>
              {isEmail ? (
                isRegister ? (
                  <EmailSignUp />
                ) : (
                  <EmailLogin />
                )
              ) : (
                <SocialLogin onPressEmail={() => setIsEmail(true)} isRegister={isRegister} />
              )}
            </View>
            <View className="mt-10">
              <TermsCheckBox />
              <View className="mt-8">
                {isEmail ? (
                  <Text
                    className="pb-2 text-center text-lg font-medium text-label"
                    testID="auth-back"
                    onPress={() => setIsEmail(false)}
                  >
                    {t("login.back")}
                  </Text>
                ) : (
                  <Pressable testID="auth-toggle-mode" onPress={() => setIsRegister(!isRegister)}>
                    <Text className="pb-2 text-center text-lg font-medium text-label">
                      <Trans
                        t={t}
                        i18nKey={isRegister ? "login.have_account" : "login.no_account"}
                        components={{
                          strong: <Text className="text-accent" />,
                        }}
                      />
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}
const TermsCheckBox = () => {
  const shakeSharedValue = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: shakeSharedValue.value,
      },
    ],
  }))
  return (
    <Animated.View className="w-full items-center justify-center px-8" style={shakeStyle}>
      <TermsText />
    </Animated.View>
  )
}
const TermsText = () => {
  const { t } = useTranslation()
  return (
    <View className="items-center">
      <Text className="text-center text-sm text-secondary-label">{t("login.agree_to")} </Text>
      <View className="flex-row flex-wrap items-center justify-center">
        <Pressable
          onPress={() => Linking.openURL("https://folo.is/terms-of-service")}
          className="text-secondary-label"
        >
          <Text className="font-semibold">{t("login.terms")}</Text>
        </Pressable>
        <Text className="px-2 text-secondary-label">/</Text>
        <Pressable
          onPress={() => Linking.openURL("https://folo.is/privacy-policy")}
          className="text-secondary-label"
        >
          <Text className="font-semibold">{t("login.privacy")}</Text>
        </Pressable>
      </View>
    </View>
  )
}
