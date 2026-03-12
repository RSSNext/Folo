import { tracker } from "@follow/tracker"
import * as AppleAuthentication from "expo-apple-authentication"
import { useColorScheme } from "nativewind"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, View } from "react-native"
import DeviceInfo from "react-native-device-info"

import { Image } from "@/src/components/ui/image/Image"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { Text } from "@/src/components/ui/typography/Text"
import { signIn, useAuthProviders } from "@/src/lib/auth"

export function SocialLogin({ onPressEmail }: { isRegister: boolean; onPressEmail: () => void }) {
  const { data: authProviders, isLoading } = useAuthProviders()
  const { colorScheme } = useColorScheme()
  const providers = Object.entries(authProviders || {})
  const credentialProvider = providers.find(([, provider]) => provider.id === "credential")?.[1]
  const socialProviders = providers.filter(([, provider]) => {
    if (provider.id === "credential") return false
    if (Platform.OS === "ios" && DeviceInfo.isEmulatorSync() && provider.id === "apple") {
      return false
    }
    return true
  })
  const { t } = useTranslation()

  return (
    <View className="flex w-screen items-center justify-center gap-4 px-6">
      <Pressable
        testID="login-provider-credential"
        hitSlop={20}
        className="border-hairline flex w-full flex-row items-center justify-center gap-2 rounded-xl border-opaque-separator py-4 pl-5"
        onPress={onPressEmail}
      >
        {!!credentialProvider?.icon64 && (
          <Image
            source={{
              uri:
                colorScheme === "dark"
                  ? credentialProvider.iconDark64 || credentialProvider.icon64
                  : credentialProvider.icon64,
            }}
            className="absolute left-9 size-6"
            contentFit="contain"
          />
        )}
        <Text className="text-lg font-semibold text-label">
          {t("login.continueWith", {
            provider: credentialProvider?.name ?? t("login.email"),
          })}
        </Text>
      </Pressable>

      {isLoading ? (
        <View className="flex h-16 w-full items-center justify-center">
          <PlatformActivityIndicator />
        </View>
      ) : null}

      {socialProviders.map(([key, provider]) => {
        return (
          <Pressable
            key={key}
            testID={`login-provider-${provider.id}`}
            hitSlop={20}
            className="border-hairline flex w-full flex-row items-center justify-center gap-2 rounded-xl border-opaque-separator py-4 pl-5"
            onPress={async () => {
              if (provider.id === "apple") {
                try {
                  const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                      AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                  })
                  if (credential.identityToken) {
                    await signIn.social({
                      provider: "apple",
                      idToken: {
                        token: credential.identityToken,
                      },
                    })
                    tracker.userLogin({
                      type: "social",
                    })
                  } else {
                    throw new Error("No identityToken.")
                  }
                } catch (e) {
                  console.error(e)
                  // handle errors
                }
                return
              }
              await signIn.social({
                provider: provider.id as any,
                callbackURL: "/",
              })
              tracker.userLogin({
                type: "social",
              })
            }}
          >
            <Image
              source={{
                uri:
                  colorScheme === "dark" ? provider.iconDark64 || provider.icon64 : provider.icon64,
              }}
              className="absolute left-9 size-6"
              contentFit="contain"
            />
            <Text className="text-lg font-semibold text-label">
              {t("login.continueWith", {
                provider: provider.name,
              })}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
