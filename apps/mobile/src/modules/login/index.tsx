import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Linking, Pressable, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import { KeyboardAvoidingView, KeyboardController } from "react-native-keyboard-controller"
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
  return (
    <View
      className="pb-safe-or-2 flex-1 justify-between"
      style={{
        paddingTop: insets.top + 56,
      }}
    >
      <KeyboardAvoidingView behavior={"position"}>
        <TouchableWithoutFeedback
          onPress={() => {
            KeyboardController.dismiss()
          }}
          accessible={false}
        >
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
        </TouchableWithoutFeedback>
        <TermsCheckBox />
        <View className="mt-14">
          {isEmail ? (
            <Text
              className="pb-2 text-center text-lg font-medium text-label"
              onPress={() => setIsEmail(false)}
            >
              {t("login.back")}
            </Text>
          ) : (
            <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
              <Text className="pb-2 text-center text-lg font-medium text-label">
                <Trans
                  t={t}
                  i18nKey={isRegister ? "login.have_account" : "login.no_account"}
                  components={{
                    strong: <Text className="text-accent" />,
                  }}
                />
              </Text>
            </TouchableOpacity>
          )}
        </View>
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
    <Animated.View
      className="mt-4 w-full flex-row items-center justify-center gap-2 px-8"
      style={shakeStyle}
    >
      <TermsText />
    </Animated.View>
  )
}
const TermsText = () => {
  return (
    <View>
      <Text className="text-center text-sm text-secondary-label">
        By continuing, you agree to our{" "}
      </Text>
      <View className="flex-row items-center">
        <Pressable
          onPress={() => Linking.openURL("https://folo.is/terms-of-service")}
          className="text-secondary-label"
        >
          <Text className="font-semibold">Terms of Service</Text>
        </Pressable>
        <Text className="text-secondary-label">&nbsp;&&nbsp;</Text>
        <Pressable
          onPress={() => Linking.openURL("https://folo.is/privacy-policy")}
          className="text-secondary-label"
        >
          <Text className="font-semibold">Privacy Policy</Text>
        </Pressable>
      </View>
    </View>
  )
}
