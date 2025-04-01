import { cn } from "@follow/utils"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { Clipboard, Pressable, Text, View } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import { UINavigationHeaderActionButton } from "@/src/components/layouts/header/NavigationHeader"
import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { UserAvatar } from "@/src/components/ui/avatar/UserAvatar"
import { ContextMenu } from "@/src/components/ui/context-menu"
import {
  GroupedInformationCell,
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { MonoText } from "@/src/components/ui/typography/MonoText"
import { LoveCuteFiIcon } from "@/src/icons/love_cute_fi"
import { PowerIcon } from "@/src/icons/power"
import { apiClient } from "@/src/lib/api-fetch"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { accentColor } from "@/src/theme/colors"

const useInvitationsQuery = () => {
  const { data } = useQuery({
    queryKey: ["invitations"],
    queryFn: () => apiClient.invitations.$get(),
  })
  return data?.data
}
const useInvitationsLimitationQuery = () => {
  const { data } = useQuery({
    queryKey: ["invitations", "limitation"],
    queryFn: () => apiClient.invitations.limitation.$get(),
  })
  return data?.data
}
// export const invitations = {
//   list: () =>
//     defineQuery(["invitations"], async () => {
//       const res = await apiClient.invitations.$get()
//       return res.data
//     }),

//   limitation: () =>
//     defineQuery(["invitations", "limitation"], async () => {
//       const res = await apiClient.invitations.limitation.$get()
//       return res.data
//     }),
// }

const numberFormatter = new Intl.NumberFormat("en-US")
export const InvitationsScreen: NavigationControllerView = () => {
  const serverConfigs = useServerConfigs()

  const invitations = useInvitationsQuery()
  const limitation = useInvitationsLimitationQuery()
  const handleCopyCode = (code: string) => {
    Clipboard.setString(code)
    toast.success("Copied to clipboard")
  }
  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="Invitations" headerRight={<GenerateButton />} />
      <View className="mt-6">
        <GroupedInsetListCard>
          <GroupedInformationCell
            title="Invitations"
            icon={<LoveCuteFiIcon height={40} width={40} color="#fff" />}
            iconBackgroundColor={accentColor}
          >
            <Text className="text-label mt-3 text-base leading-tight">
              Follow is currently in <Text className="font-bold">early access</Text> and requires an
              invitation code to use. You can spend {serverConfigs?.INVITATION_PRICE}{" "}
              <View style={{ transform: [{ translateY: 6 }, { translateX: -2 }] }}>
                <PowerIcon color={accentColor} height={16} width={16} />
              </View>
              Power to generate an invitation code for your friends.
            </Text>

            <Text className="text-label mt-3 text-base leading-tight">
              Based on your usage time, you can generate up to{" "}
              {numberFormatter.format(limitation ?? 0)} invitation codes.
            </Text>
          </GroupedInformationCell>
        </GroupedInsetListCard>
      </View>

      <GroupedInsetListSectionHeader label="Invitations" />
      <GroupedInsetListCard>
        {invitations?.map((invitation) => (
          <ContextMenu.Root key={invitation.code}>
            <ContextMenu.Trigger>
              <GroupedInsetListBaseCell className="bg-secondary-system-grouped-background flex-1">
                <View className="mr-2 shrink flex-row items-center gap-4">
                  <UserAvatar size={26} image={invitation.users?.image} preview={false} />
                  <View className="min-w-0 shrink">
                    <Text className="text-label" numberOfLines={1}>
                      {invitation.users?.name}
                    </Text>
                    <Text className="text-secondary-label text-sm">
                      Created at {dayjs(invitation.createdAt).format("YYYY/MM/DD")}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => handleCopyCode(invitation.code)}>
                  <MonoText className="text-label">{invitation.code}</MonoText>
                </Pressable>
              </GroupedInsetListBaseCell>
            </ContextMenu.Trigger>
            <ContextMenu.Content>
              <ContextMenu.Item
                key="copy code"
                onSelect={() => {
                  handleCopyCode(invitation.code)
                }}
              >
                <ContextMenu.ItemTitle>Copy</ContextMenu.ItemTitle>
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Root>
        ))}
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}

const GenerateButton = () => {
  const limitation = useInvitationsLimitationQuery()
  const invitations = useInvitationsQuery()
  const disabled = !limitation || (invitations && invitations?.length >= limitation)
  return (
    <UINavigationHeaderActionButton disabled={disabled}>
      <Text
        className={cn(
          "text-base font-semibold",
          !disabled ? "text-accent" : "text-secondary-label",
        )}
      >
        Generate
      </Text>
    </UINavigationHeaderActionButton>
  )
}
