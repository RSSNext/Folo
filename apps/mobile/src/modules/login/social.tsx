import { tracker } from "@follow/tracker"
import * as AppleAuthentication from "expo-apple-authentication"
import { useColorScheme } from "nativewind"
import { useTranslation } from "react-i18next"
import { TouchableOpacity, View } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import { Image } from "@/src/components/ui/image/Image"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { Text } from "@/src/components/ui/typography/Text"
import { signIn, useAuthProviders } from "@/src/lib/auth"

import { ReferralForm } from "./referral"

export function SocialLogin({
  onPressEmail,
  isRegister,
}: {
  isRegister: boolean
  onPressEmail: () => void
}) {
  const serverConfigs = useServerConfigs()
  const { data: authProviders, isLoading } = useAuthProviders()
  const { colorScheme } = useColorScheme()
  const providers = Object.entries(authProviders || [])
  const { t } = useTranslation()
  if (isLoading) {
    return (
      <View className="flex h-[240px] w-screen items-center justify-center">
        <PlatformActivityIndicator />
      </View>
    )
  }
  return (
    <View className="flex w-screen items-center justify-center gap-4 px-6">
      {providers.map(([key, provider]) => {
        return (
          <TouchableOpacity
            key={key}
            hitSlop={20}
            className="border-opaque-separator border-hairline flex w-full flex-row items-center justify-center gap-2 rounded-xl py-4 pl-5"
            onPress={async () => {
              if (provider.id === "credential") {
                onPressEmail()
                return
              }
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
            <Text className="text-label text-lg font-semibold">
              {t("login.continueWith", {
                provider: provider.name,
              })}
            </Text>
          </TouchableOpacity>
        )
      })}
      {isRegister && serverConfigs?.REFERRAL_ENABLED && (
        <View className="border-opaque-separator border-hairline w-full rounded-xl px-6 py-4">
          <ReferralForm />
        </View>
      )}
    </View>
  )
}
