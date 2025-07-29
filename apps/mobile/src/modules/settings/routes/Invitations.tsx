import { cn } from "@follow/utils"
import { useMutation, useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { setStringAsync } from "expo-clipboard"
import { Trans, useTranslation } from "react-i18next"
import { Pressable, View } from "react-native"

import { useServerConfigs } from "@/src/atoms/server-configs"
import { UINavigationHeaderActionButton } from "@/src/components/layouts/header/NavigationHeader"
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
import { Text } from "@/src/components/ui/typography/Text"
import { LoveCuteFiIcon } from "@/src/icons/love_cute_fi"
import { PowerIcon } from "@/src/icons/power"
import { apiClient } from "@/src/lib/api-fetch"
import type { DialogComponent } from "@/src/lib/dialog"
import { Dialog } from "@/src/lib/dialog"
import { toastFetchError } from "@/src/lib/error-parser"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { queryClient } from "@/src/lib/query-client"
import { toast } from "@/src/lib/toast"
import { accentColor, useColor } from "@/src/theme/colors"

import { useTOTPModalWrapper } from "../hooks/useTOTPModalWrapper"

const invitationQueryKey = ["invitations"]
const useInvitationsQuery = () => {
  return useQuery({
    queryKey: invitationQueryKey,
    queryFn: () => apiClient.invitations.$get().then((res) => res.data),
  })
}
const useInvitationsLimitationQuery = () => {
  const { data } = useQuery({
    queryKey: ["invitations", "limitation"],
    queryFn: () => apiClient.invitations.limitation.$get(),
  })
  return data?.data
}
const numberFormatter = new Intl.NumberFormat("en-US")
export const InvitationsScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")
  const serverConfigs = useServerConfigs()
  const { data: invitations, isLoading } = useInvitationsQuery()
  const limitation = useInvitationsLimitationQuery()
  const handleCopyCode = (code: string) => {
    setStringAsync(code)
    toast.success("Copied to clipboard")
  }
  const secondaryLabelColor = useColor("secondaryLabel")
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={
        <NavigationBlurEffectHeaderView
          title={t("titles.invitations")}
          headerRight={<GenerateButton />}
        />
      }
    >
      <View className="mt-6">
        <GroupedInsetListCard>
          <GroupedInformationCell
            title={t("titles.invitations")}
            icon={<LoveCuteFiIcon height={40} width={40} color="#fff" />}
            iconBackgroundColor={"#EC4899"}
          >
            <Trans
              ns="settings"
              i18nKey="invitation.earlyAccess"
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-label mt-3 text-left text-base leading-tight">
                  {children}
                </Text>
              )}
              components={{
                strong: <Text className="font-bold" />,
              }}
            />
            <Trans
              ns="settings"
              i18nKey="invitation.generateCost"
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-label mt-3 text-left text-base leading-tight">
                  {children}
                </Text>
              )}
              values={{
                INVITATION_PRICE: serverConfigs?.INVITATION_PRICE,
              }}
              components={{
                PowerIcon: (
                  <View
                    style={{
                      transform: [
                        {
                          translateY: 6,
                        },
                        {
                          translateX: -2,
                        },
                      ],
                    }}
                  >
                    <PowerIcon color={accentColor} height={16} width={16} />
                  </View>
                ),
              }}
            />
            <Trans
              ns="settings"
              i18nKey="invitation.limitationMessage"
              parent={({ children }: { children: React.ReactNode }) => (
                <Text className="text-label mt-3 text-base leading-tight">{children}</Text>
              )}
              values={{
                limitation: numberFormatter.format(limitation ?? 0),
              }}
            />
          </GroupedInformationCell>
        </GroupedInsetListCard>
      </View>

      <GroupedInsetListSectionHeader label={t("titles.invitations")} />
      <GroupedInsetListCard>
        {isLoading && <GroupedInsetActivityIndicatorCell />}
        {invitations?.map((invitation) => (
          <ContextMenu.Root key={invitation.code}>
            <ContextMenu.Trigger>
              <GroupedInsetListBaseCell className="bg-secondary-system-grouped-background flex-1">
                <View className="mr-2 shrink flex-row items-center gap-4">
                  <UserAvatar
                    size={26}
                    image={invitation.users?.image}
                    preview={false}
                    color={secondaryLabelColor}
                  />
                  <View className="min-w-0 shrink">
                    <Text
                      className={cn("text-label", !invitation.users && "text-secondary-label")}
                      numberOfLines={1}
                    >
                      {invitation.users?.name || (!invitation.users ? t("invitation.notUsed") : "")}
                    </Text>
                    <Text className="text-secondary-label text-sm">
                      {t("invitation.created_at")}{" "}
                      {dayjs(invitation.createdAt).format("YYYY/MM/DD")}
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
  const { t } = useTranslation("settings")
  const limitation = useInvitationsLimitationQuery()
  const { data: invitations } = useInvitationsQuery()
  const disabled = !limitation || (invitations && invitations?.length >= limitation)
  return (
    <UINavigationHeaderActionButton
      disabled={disabled}
      onPress={() => {
        Dialog.show(ConfirmGenerateDialog)
      }}
    >
      <Text
        className={cn(
          "text-base font-semibold",
          !disabled ? "text-accent" : "text-secondary-label",
        )}
      >
        {t("invitation.generate")}
      </Text>
    </UINavigationHeaderActionButton>
  )
}
const ConfirmGenerateDialog: DialogComponent = () => {
  const serverConfigs = useServerConfigs()
  const { dismiss } = Dialog.useDialogContext()!
  const newInvitation = useMutation({
    mutationKey: ["newInvitation"],
    mutationFn: (values: Parameters<typeof apiClient.invitations.new.$post>[0]["json"]) =>
      apiClient.invitations.new.$post({
        json: values,
      }),
    onError(err) {
      toastFetchError(err)
      console.error(err)
    },
    onMutate() {
      dismiss()
    },
    onSuccess(data) {
      toast.success("Generate successfully, code is copied to clipboard")
      type Invitation = {
        code: string
        createdAt: string | null
      }
      const old = queryClient.getQueryData<Invitation[]>(invitationQueryKey)
      setStringAsync(data.data)
      queryClient.setQueryData<Invitation[]>(invitationQueryKey, () => {
        return [
          {
            code: data.data,
            createdAt: dayjs().toISOString(),
          },
          ...(old ?? []),
        ]
      })
    },
  })
  const confirm = useTOTPModalWrapper(newInvitation.mutateAsync, {
    dismiss,
  })
  return (
    <View>
      <Text>
        You can spend {serverConfigs?.INVITATION_PRICE}{" "}
        <View
          style={{
            transform: [
              {
                translateY: 2,
              },
            ],
          }}
        >
          <PowerIcon color={accentColor} height={16} width={16} />
        </View>{" "}
        Power to generate an invitation code for your friends.
      </Text>

      <Dialog.DialogConfirm
        onPress={() => {
          confirm({})
        }}
      />
    </View>
  )
}
ConfirmGenerateDialog.id = "ConfirmGenerateDialog"
ConfirmGenerateDialog.confirmText = "Generate"
ConfirmGenerateDialog.title = "Generate Invitation Code"
ConfirmGenerateDialog.headerIcon = <PowerIcon color={accentColor} height={24} width={24} />
