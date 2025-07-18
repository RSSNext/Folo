import { UserRole, UserRoleName } from "@follow/constants"
import { env } from "@follow/shared/env.rn"
import { useWhoami } from "@follow/store/user/hooks"
import { cn } from "@follow/utils"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { setStringAsync } from "expo-clipboard"
import { Trans, useTranslation } from "react-i18next"
import { Linking, Pressable, Share, Text, View } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { ContextMenu } from "@/src/components/ui/context-menu"
import {
  GroupedInformationCell,
  GroupedInsetActivityIndicatorCell,
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { MonoText } from "@/src/components/ui/typography/MonoText"
import { LoveCuteFiIcon } from "@/src/icons/love_cute_fi"
import { apiClient } from "@/src/lib/api-fetch"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { useColor } from "@/src/theme/colors"

const useReferralInfoQuery = () => {
  return useQuery({
    queryKey: ["referral", "info"],
    queryFn: () => apiClient.referrals.$get().then((res) => res.data),
  })
}

export const ReferralScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const ruleLink = serverConfigs?.REFERRAL_RULE_LINK
  const requiredInvitationsAmount = serverConfigs?.REFERRAL_REQUIRED_INVITATIONS || 3

  const { data: referralInfo, isLoading } = useReferralInfoQuery()
  const invitations = referralInfo?.invitations
  const validInvitationsAmount = referralInfo?.invitations.filter((i) => i.usedAt).length || 0
  const user = useWhoami()
  const referralLink = `${env.WEB_URL}/register?referral=${user?.handle || user?.id}`

  const secondaryLabelColor = useColor("secondaryLabel")

  const progress = (validInvitationsAmount / requiredInvitationsAmount) * 100
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("titles.referral.long")} />}
    >
      <View className="mt-6">
        <GroupedInsetListCard>
          <GroupedInformationCell
            title={t("titles.referral.short")}
            icon={<LoveCuteFiIcon height={40} width={40} color="#fff" />}
            iconBackgroundColor={"#EC4899"}
          >
            <Trans
              ns="settings"
              i18nKey="referral.description"
              values={{
                day: referralInfo?.referralCycleDays || 45,
              }}
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-label mt-3 text-left text-base leading-tight">
                  {children}
                </Text>
              )}
              components={{
                Link: (
                  <Text
                    className="text-accent"
                    onPress={() => {
                      if (ruleLink) {
                        Linking.openURL(ruleLink)
                      }
                    }}
                  >
                    Learn more
                  </Text>
                ),
              }}
            />
          </GroupedInformationCell>
        </GroupedInsetListCard>
      </View>

      <GroupedInsetListSectionHeader label={t("referral.link")} />
      <GroupedInsetListCard>
        <ContextMenu.Root>
          <ContextMenu.Trigger>
            <GroupedInsetListBaseCell>
              <Pressable
                onPress={() => {
                  Share.share({ url: referralLink })
                }}
              >
                <MonoText className="text-label">{referralLink}</MonoText>
              </Pressable>
            </GroupedInsetListBaseCell>
          </ContextMenu.Trigger>
          <ContextMenu.Content>
            <ContextMenu.Item
              key="copy"
              onSelect={() => {
                setStringAsync(referralLink)
                toast.success("Referral link copied to clipboard")
              }}
            >
              <ContextMenu.ItemTitle>Copy</ContextMenu.ItemTitle>
            </ContextMenu.Item>
          </ContextMenu.Content>
        </ContextMenu.Root>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader
        label={`Referral Progress for the Free ${UserRoleName[UserRole.PrePro]} ${validInvitationsAmount}/${requiredInvitationsAmount}:`}
      />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell>
          <View className="bg-system-grouped-background h-2 w-full rounded-full">
            <View
              className="bg-accent h-2 rounded-full"
              style={{
                width: `${progress}%`,
              }}
            />
          </View>
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader label={"Your Invited Friends"} />
      <GroupedInsetListCard>
        {isLoading && <GroupedInsetActivityIndicatorCell />}
        {invitations?.map((invitation) => (
          <GroupedInsetListBaseCell
            key={invitation.code}
            className="bg-secondary-system-grouped-background flex-1"
          >
            <View className="mr-2 shrink flex-row items-center gap-4">
              <UserAvatar
                size={26}
                image={invitation.user?.image}
                preview={false}
                color={secondaryLabelColor}
              />
              <View className="min-w-0 shrink">
                <Text
                  className={cn("text-label", !invitation.user && "text-secondary-label")}
                  numberOfLines={1}
                >
                  {invitation.user?.name || (!invitation.user ? t("invitation.notUsed") : "")}
                </Text>
                <Text className="text-secondary-label text-sm">
                  {t("invitation.created_at")} {dayjs(invitation.createdAt).format("YYYY/MM/DD")}
                </Text>
              </View>
            </View>
            <Text className="text-label">
              {invitation.usedAt
                ? t("referral.invited_friend_status.valid")
                : t("referral.invited_friend_status.pending")}
            </Text>
          </GroupedInsetListBaseCell>
        ))}
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
