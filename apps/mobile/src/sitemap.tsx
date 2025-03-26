import { NavigationSitemapRegistry } from "./lib/navigation/sitemap/registry"
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
      stackPresentation: "transparentModal",
    })
  })
}
