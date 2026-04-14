import { userSyncService } from "@follow/store/user/store"
import { tracker } from "@follow/tracker"
import * as AppleAuthentication from "expo-apple-authentication"
import { useColorScheme } from "nativewind"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Platform, Pressable, View } from "react-native"
import DeviceInfo from "react-native-device-info"

import { Image } from "@/src/components/ui/image/Image"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { Text } from "@/src/components/ui/typography/Text"
import { signIn, useAuthProviders } from "@/src/lib/auth"

import { loginWithSocialProvider } from "./social-login"

type SocialProviderSignInInput = Parameters<typeof signIn.social>[0]

export function SocialLogin({ onPressEmail }: { isRegister: boolean; onPressEmail: () => void }) {
  const { data: authProviders, isLoading } = useAuthProviders()
  const { colorScheme } = useColorScheme()
  const [pendingProviderId, setPendingProviderId] = useState<string | null>(null)
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
  const isPending = !!pendingProviderId

  return (
    <View className="mx-auto flex w-full max-w-sm items-center justify-center gap-4 px-4">
      <Pressable
        testID="login-provider-credential"
        hitSlop={20}
        disabled={isPending}
        className="border-hairline flex w-full flex-row items-center justify-center gap-2 rounded-xl border-opaque-separator px-5 py-4 disabled:opacity-60"
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
            className="absolute left-6 size-6"
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
            disabled={isPending}
            className="border-hairline flex w-full flex-row items-center justify-center gap-2 rounded-xl border-opaque-separator px-5 py-4 disabled:opacity-60"
            onPress={() => {
              void loginWithSocialProvider({
                providerId: provider.id,
                setPendingProviderId,
                signInWithProvider: async (providerId) => {
                  await signIn.social({
                    provider: providerId as SocialProviderSignInInput["provider"],
                    callbackURL: "/",
                  })
                },
                signInWithAppleIdentityToken: async () => {
                  const credential = await AppleAuthentication.signInAsync({
                    requestedScopes: [
                      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                      AppleAuthentication.AppleAuthenticationScope.EMAIL,
                    ],
                  })
                  if (!credential.identityToken) {
                    throw new Error("No identityToken.")
                  }

                  await signIn.social({
                    provider: "apple",
                    idToken: {
                      token: credential.identityToken,
                    },
                  })
                },
                syncSession: async () => {
                  const session = await userSyncService.whoami().catch((error) => {
                    console.error(error)
                    return null
                  })
                  return !!session?.user
                },
                trackLogin: () => {
                  tracker.userLogin({
                    type: "social",
                  })
                },
                onError: (error) => {
                  console.error(error)
                },
              })
            }}
          >
            {pendingProviderId === provider.id ? (
              <View className="absolute left-6 size-6 items-center justify-center">
                <PlatformActivityIndicator size="small" />
              </View>
            ) : (
              <Image
                source={{
                  uri:
                    colorScheme === "dark"
                      ? provider.iconDark64 || provider.icon64
                      : provider.icon64,
                }}
                className="absolute left-6 size-6"
                contentFit="contain"
              />
            )}
            <Text className="text-lg font-semibold text-label">
              {pendingProviderId === provider.id
                ? t("login.redirecting")
                : t("login.continueWith", {
                    provider: provider.name,
                  })}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
