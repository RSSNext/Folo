import { useWhoami } from "@follow/store/user/hooks"
import { userSyncService } from "@follow/store/user/store"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { FC } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Alert, View } from "react-native"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { GroupedInsetListCardItemStyle } from "@/src/components/ui/grouped/GroupedInsetListCardItemStyle"
import {
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
  GroupedInsetListNavigationLinkIcon,
  GroupedInsetListSectionHeader,
  GroupedPlainButtonCell,
} from "@/src/components/ui/grouped/GroupedList"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { Text } from "@/src/components/ui/typography/Text"
import { AppleCuteFiIcon } from "@/src/icons/apple_cute_fi"
import { GithubCuteFiIcon } from "@/src/icons/github_cute_fi"
import { GoogleCuteFiIcon } from "@/src/icons/google_cute_fi"
import type { AuthProvider } from "@/src/lib/auth"
import {
  deleteUser,
  forgetPassword,
  getAccountInfo,
  getProviders,
  linkSocial,
  unlinkAccount,
} from "@/src/lib/auth"
import { Dialog } from "@/src/lib/dialog"
import { loading } from "@/src/lib/loading"
import { openLink } from "@/src/lib/native"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"

import { ConfirmPasswordDialog } from "../../dialogs/ConfirmPasswordDialog"
import { ConfirmTOTPCodeDialog } from "../../dialogs/ConfirmTOTPCodeDialog"
import { TwoFASetting } from "./2FASetting"
import { ResetPassword } from "./ResetPassword"

type Account = {
  id: string
  accountId?: string
  provider: string
  profile:
    | {
        id: string
        name?: string
        email?: string | null
        image?: string
        emailVerified: boolean
      }
    | null
    | undefined
}
const accountInfoKey = ["account-info"]
const userProviderKey = ["providers"]
const useAccount = () => {
  return useQuery({
    queryKey: accountInfoKey,
    queryFn: () => getAccountInfo(),
  })
}
export const AccountScreen = () => {
  const { t } = useTranslation("settings")
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("titles.account")} />}
    >
      <AuthenticationSection />
      <SecuritySection />
    </SafeNavigationScrollView>
  )
}
const provider2IconMap = {
  google: (
    <GroupedInsetListNavigationLinkIcon backgroundColor="#4081EC">
      <GoogleCuteFiIcon height={24} width={24} color="#fff" />
    </GroupedInsetListNavigationLinkIcon>
  ),
  github: (
    <GroupedInsetListNavigationLinkIcon backgroundColor="#000">
      <GithubCuteFiIcon height={24} width={24} color="#fff" />
    </GroupedInsetListNavigationLinkIcon>
  ),
  apple: (
    <GroupedInsetListNavigationLinkIcon backgroundColor="#000">
      <AppleCuteFiIcon height={24} width={24} color="#fff" />
    </GroupedInsetListNavigationLinkIcon>
  ),
}
const provider2LabelMap = {
  google: "Google",
  github: "GitHub",
  apple: "Apple",
}
const AccountLinker: FC<{
  provider: keyof typeof provider2IconMap
  account?: Account
}> = ({ provider, account }) => {
  const queryClient = useQueryClient()
  const unlinkAccountMutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Account not found")
      const res = await unlinkAccount({
        providerId: provider,
        accountId: account.accountId,
      })
      if (res.error) throw new Error(res.error.message)
    },
    onSuccess: () => {
      toast.success("Unlinked account success")
      queryClient.invalidateQueries({
        queryKey: accountInfoKey,
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
  if (!provider2LabelMap[provider]) return null
  return (
    <GroupedInsetListNavigationLink
      label={provider2LabelMap[provider]}
      icon={provider2IconMap[provider]}
      postfix={
        <Text
          ellipsizeMode="tail"
          numberOfLines={1}
          className="text-secondary-label mr-1 max-w-[150px]"
        >
          {account?.profile?.email || account?.profile?.name || ""}
        </Text>
      }
      onPress={() => {
        if (!account) {
          linkSocial({
            provider: provider as any,
          }).then((res) => {
            if (res.data) {
              openLink(res.data.url, () => {
                queryClient.invalidateQueries({
                  queryKey: [accountInfoKey],
                })
                queryClient.invalidateQueries({
                  queryKey: [userProviderKey],
                })
              })
            } else {
              toast.error("Failed to link account")
            }
          })
          return
        }
        Alert.alert("Unlink account", "Are you sure you want to unlink your account?", [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Unlink",
            style: "destructive",
            onPress: () => unlinkAccountMutation.mutate(),
          },
        ])
      }}
    />
  )
}
;(AccountLinker as any).itemStyle = GroupedInsetListCardItemStyle.NavigationLink
const AuthenticationSection = () => {
  const { t } = useTranslation("settings")
  const { data: accounts } = useAccount()
  const { data: providers, isLoading } = useQuery({
    queryKey: userProviderKey,
    queryFn: async () => (await getProviders()).data as Record<string, AuthProvider>,
  })
  const providerToAccountMap = useMemo(() => {
    return Object.keys(providers || {}).reduce(
      (acc, provider) => {
        acc[provider] = accounts?.data?.find((account) => account.provider === provider)!
        return acc
      },
      {} as Record<string, Account>,
    )
  }, [accounts?.data, providers])
  return (
    <>
      <GroupedInsetListSectionHeader label={t("profile.link_social.authentication")} />
      <GroupedInsetListCard>
        {providers ? (
          Object.keys(providers).map((provider) => (
            <AccountLinker
              key={provider}
              provider={provider as any}
              account={providerToAccountMap[provider]}
            />
          ))
        ) : isLoading ? (
          <View className="flex h-12 flex-1 items-center justify-center">
            <PlatformActivityIndicator />
          </View>
        ) : null}
      </GroupedInsetListCard>
    </>
  )
}
const SecuritySection = () => {
  const { t } = useTranslation("settings")
  const { data: account } = useAccount()
  const hasPassword = account?.data?.find((account) => account.provider === "credential")
  const whoAmI = useWhoami()
  const twoFactorEnabled = whoAmI?.twoFactorEnabled
  const navigation = useNavigation()
  return (
    <>
      <GroupedInsetListSectionHeader label={t("profile.security")} />
      <GroupedInsetListCard>
        <GroupedPlainButtonCell
          textClassName="text-left"
          label={t("profile.change_password.label")}
          onPress={() => {
            const email = whoAmI?.email || ""
            if (!email) {
              toast.error("You need to login with email first")
              return
            }
            if (!hasPassword) {
              forgetPassword({
                email,
              })
              toast.success("We have sent you an email with instructions to reset your password.")
            } else {
              navigation.pushControllerView(ResetPassword)
            }
          }}
        />
        <GroupedPlainButtonCell
          textClassName="text-left"
          label={
            twoFactorEnabled ? t("profile.two_factor.disable") : t("profile.two_factor.enable")
          }
          onPress={() => {
            Dialog.show(ConfirmPasswordDialog, {
              override: {
                async onConfirm(ctx) {
                  ctx.dismiss()
                  const { done } = loading.start()
                  if (twoFactorEnabled) {
                    const res = await userSyncService
                      .updateTwoFactor(false, ctx.password)
                      .finally(() => done())
                    if (res.error?.message) {
                      toast.error("Invalid password or something went wrong")
                      return
                    }
                    toast.success("2FA disabled")
                    return
                  }
                  const { password } = ctx
                  const res = await userSyncService
                    .updateTwoFactor(true, password)
                    .finally(() => done())
                  if (res.error?.message) {
                    toast.error("Invalid password or something went wrong")
                    return
                  }
                  if (res.data && "totpURI" in res.data) {
                    navigation.pushControllerView(TwoFASetting, {
                      totpURI: res.data.totpURI,
                    })
                  } else {
                    toast.error("Failed to enable 2FA")
                  }
                },
              },
            })
          }}
        />
        <GroupedPlainButtonCell
          label={t("profile.delete_account.label")}
          textClassName="text-red text-left"
          onPress={async () => {
            Alert.alert(
              "Delete account",
              "Are you sure you want to delete your account? \nThis action is irreversible and may take up to two days to take effect.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    // await signOut()
                    Dialog.show(ConfirmTOTPCodeDialog, {
                      override: {
                        async onConfirm(ctx) {
                          ctx.dismiss()
                          await deleteUser({
                            TOTPCode: ctx.totpCode,
                          })
                        },
                      },
                    })
                  },
                },
              ],
            )
          }}
        />
      </GroupedInsetListCard>
    </>
  )
}
