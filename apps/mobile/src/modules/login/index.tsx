import { useCallback, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as ContextMenu from "zeego/context-menu"

import { Logo } from "@/src/components/ui/logo"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { NavigationLink } from "@/src/lib/navigation/NavigationLink"
import { useScaleHeight } from "@/src/lib/responsive"
import { PrivacyPolicyScreen } from "@/src/screens/(headless)/PrivacyPolicyScreen"
import { TermsMarkdown, TermsScreen } from "@/src/screens/(headless)/TermsScreen"

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
    <View className="pb-safe-or-2 flex-1 justify-between" style={{ paddingTop: insets.top + 56 }}>
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
          <Logo style={{ width: logoSize, height: logoSize }} />
          <Text
            className="text-label"
            style={{
              fontSize,
              lineHeight,
            }}
          >
            <Text className="font-semibold">{`${isRegister ? t("signin.sign_up_to") : t("signin.sign_in_to")} `}</Text>
            <Text className="font-bold">Folo</Text>
          </Text>
          {isEmail ? (
            isRegister ? (
              <EmailSignUp />
            ) : (
              <EmailLogin />
            )
          ) : (
            <SocialLogin onPressEmail={() => setIsEmail(true)} />
          )}
        </View>
      </TouchableWithoutFeedback>
      <TermsCheckBox />
      <View className="mt-14">
        {isEmail ? (
          <Text
            className="text-label pb-2 text-center text-lg font-medium"
            onPress={() => setIsEmail(false)}
          >
            {t("login.back")}
          </Text>
        ) : (
          <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
            <Text className="text-label pb-2 text-center text-lg font-medium">
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
    </View>
  )
}

const TermsCheckBox = () => {
  const shakeSharedValue = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeSharedValue.value }],
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
  const navigation = useNavigation()
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger className="w-full overflow-hidden rounded-full">
        <Text className="text-secondary-label text-center text-sm">
          By continuing, you agree to our{" "}
        </Text>
        <View className="flex-row items-center">
          <NavigationLink
            destination={TermsScreen}
            suppressHighlighting
            className="text-secondary-label"
          >
            <Text className="font-semibold">Terms of Service</Text>
          </NavigationLink>
          <Text className="text-secondary-label">&nbsp;&&nbsp;</Text>
          <NavigationLink
            destination={PrivacyPolicyScreen}
            suppressHighlighting
            className="text-secondary-label"
          >
            <Text className="font-semibold">Privacy Policy</Text>
          </NavigationLink>
        </View>
      </ContextMenu.Trigger>

      <ContextMenu.Content>
        <ContextMenu.Preview
          size="STRETCH"
          onPress={useCallback(() => {
            navigation.pushControllerView(TermsScreen)
          }, [navigation])}
        >
          {() => (
            <View className="bg-system-background flex-1">
              <TermsMarkdown />
            </View>
          )}
        </ContextMenu.Preview>
      </ContextMenu.Content>
    </ContextMenu.Root>
  )
}
