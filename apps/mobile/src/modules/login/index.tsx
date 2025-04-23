import { useCallback } from "react"
import { Text, TouchableWithoutFeedback, View } from "react-native"
import { KeyboardController } from "react-native-keyboard-controller"
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import * as ContextMenu from "zeego/context-menu"

import { Logo } from "@/src/components/ui/logo"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { NavigationLink } from "@/src/lib/navigation/NavigationLink"
import { useScaleHeight } from "@/src/lib/responsive"
import { TermsMarkdown, TermsScreen } from "@/src/screens/(headless)/terms"

import { EmailLogin } from "./email"
import { SocialLogin } from "./social"

export function Login() {
  const insets = useSafeAreaInsets()
  const scaledHeight = useScaleHeight()
  const logoSize = scaledHeight(80)
  const gapSize = scaledHeight(28)
  const fontSize = scaledHeight(28)
  const lineHeight = scaledHeight(32)

  return (
    <View className="pb-safe-or-2 flex-1 justify-between" style={{ paddingTop: insets.top + 56 }}>
      <View>
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
              Sign in to <Text className="font-bold">Folo</Text>
            </Text>
            <EmailLogin />
          </View>
        </TouchableWithoutFeedback>
        <View className="border-t-opaque-separator border-t-hairline mx-28 mb-2 mt-4" />
        <View className="items-center gap-4">
          <View className="flex w-full max-w-sm flex-row items-center gap-4">
            <View className="bg-separator my-4 h-[0.5px] flex-1" />
            <Text className="text-secondary-label text-lg">or</Text>
            <View className="bg-separator my-4 h-[0.5px] flex-1" />
          </View>
          <SocialLogin />
        </View>
      </View>
      <TermsCheckBox />
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
        <Text className="text-secondary-label text-sm">
          <NavigationLink
            destination={TermsScreen}
            suppressHighlighting
            className="text-primary-label"
          >
            Terms of Service
          </NavigationLink>
        </Text>
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
