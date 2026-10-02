import { useMutation } from "@tanstack/react-query"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { useColor } from "react-native-uikit-colors"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { UIBarButton } from "@/src/components/ui/button/UIBarButton"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { CheckLineIcon } from "@/src/icons/check_line"
import { changePassword } from "@/src/lib/auth"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { toast } from "@/src/lib/toast"

export const ResetPassword = () => {
  const { t } = useTranslation("settings")
  const labelColor = useColor("label")
  const navigation = useNavigation()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  const isFormValid =
    !!currentPassword && !!newPassword && !!confirmNewPassword && newPassword === confirmNewPassword

  const { mutate: submitChangePassword, isPending } = useMutation({
    mutationFn: async () => {
      const res = await changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
      if (res.error) {
        throw new Error(res.error.message)
      }
    },
    onSuccess: () => {
      toast.success(t("profile.update_password_success"))
      navigation.back()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("profile.update_password_failed"))
    },
  })

  const handleSave = useCallback(() => {
    if (isPending) return
    if (!isFormValid) {
      if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
        toast.error(t("login.passwords_do_not_match", { ns: "default" }))
      }
      return
    }
    submitChangePassword()
  }, [confirmNewPassword, isFormValid, isPending, newPassword, submitChangePassword, t])

  return (
    <SafeNavigationScrollView
      className="flex-1 bg-system-grouped-background"
      Header={
        <NavigationBlurEffectHeaderView
          title={t("profile.change_password.label")}
          headerRight={useCallback(
            () => (
              <UIBarButton
                label={t("words.save", { ns: "common" })}
                normalIcon={
                  isPending ? (
                    <PlatformActivityIndicator size="small" color={labelColor} />
                  ) : (
                    <CheckLineIcon height={18} width={18} color={labelColor} />
                  )
                }
                disabled={!isFormValid || isPending}
                onPress={handleSave}
              />
            ),
            [handleSave, isFormValid, isPending, labelColor, t],
          )}
        />
      }
    >
      <GroupedInsetListSectionHeader label={t("profile.current_password.label")} />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="py-3">
          <PlainTextField
            autoFocus
            className="w-full"
            hitSlop={10}
            secureTextEntry={true}
            keyboardType="visible-password"
            placeholder={t("profile.current_password.placeholder")}
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader marginSize="small" label={t("profile.new_password.label")} />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="py-3">
          <PlainTextField
            className="w-full"
            keyboardType="visible-password"
            secureTextEntry={true}
            hitSlop={10}
            placeholder={t("profile.new_password.placeholder")}
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader
        marginSize="small"
        label={t("profile.confirm_password.label")}
      />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="py-3">
          <PlainTextField
            className="w-full"
            keyboardType="visible-password"
            secureTextEntry={true}
            hitSlop={10}
            placeholder={t("profile.confirm_password.placeholder")}
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
