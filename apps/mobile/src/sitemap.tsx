import { ActivityIndicator, Alert, View } from "react-native"

import { RotateableLoading } from "./components/common/RotateableLoading"
import { Navigation } from "./lib/navigation/Navigation"
import { NavigationSitemapRegistry } from "./lib/navigation/sitemap/registry"
import type { NavigationControllerView } from "./lib/navigation/types"
import { OTPWindow } from "./modules/settings/compoents/OTPWindow"
import { TermsScreen } from "./screens/(headless)/terms"
import { TwoFactorAuthScreen } from "./screens/(modal)/2fa"
import { ForgetPasswordScreen } from "./screens/(modal)/forget-password"
import { InvitationScreen } from "./screens/(modal)/invitation"
import { LoginScreen } from "./screens/(modal)/login"
import { SignUpScreen } from "./screens/(modal)/sign-up"
import { OnboardingScreen } from "./screens/onboarding"

export function registerSitemap() {
  ;[TermsScreen].forEach((Component) => {
    NavigationSitemapRegistry.registerByComponent(Component)
  })
  ;[LoginScreen, InvitationScreen, SignUpScreen, ForgetPasswordScreen, TwoFactorAuthScreen].forEach(
    (Component) => {
      NavigationSitemapRegistry.registerByComponent(Component, void 0, {
        stackPresentation: "modal",
      })
    },
  )
  ;[OnboardingScreen].forEach((Component) => {
    NavigationSitemapRegistry.registerByComponent(Component, void 0, {
      stackPresentation: "fullScreenModal",
    })
  })
  ;[
    /// Other
    screenHoC(OTPWindow, {
      onDismiss() {
        Navigation.rootNavigation.back()
      },
      onSuccess() {
        Navigation.rootNavigation.back()
      },
      verifyFn(code) {
        Alert.alert(code)
        return Promise.resolve()
      },
    }),
    LoadingComponentDemo,
  ].forEach((Component) => {
    NavigationSitemapRegistry.registerByComponent(Component, void 0, {
      stackPresentation: "push",
    })
  })
}

function screenHoC<P extends object>(Component: React.ComponentType<P>, props: P) {
  const Wrapper: NavigationControllerView<P> = function () {
    return (
      <View className="bg-system-background flex-1">
        <Component {...props} />
      </View>
    )
  }
  Wrapper.id = `ScreenHoC(${Component.name})`
  Wrapper.displayName = `ScreenHoC(${Component.name})`
  return Wrapper
}

const LoadingComponentDemo = () => {
  return (
    <View className="flex flex-1 items-center justify-center">
      <View className="flex flex-row gap-2">
        <ActivityIndicator size={"small"} />
        <RotateableLoading size={20} />
      </View>

      <View className="flex flex-row gap-2">
        <ActivityIndicator size={"small"} color="red" />
        <RotateableLoading size={20} color="red" />
      </View>

      <View className="flex flex-row gap-2">
        <ActivityIndicator size={"large"} color="red" />
        <RotateableLoading size={36} color="red" />
      </View>
    </View>
  )
}
