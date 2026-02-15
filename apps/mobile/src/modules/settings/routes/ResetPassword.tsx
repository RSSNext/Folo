import { useMutation } from "@tanstack/react-query"
import { useCallback, useState } from "react"
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
      toast.success("Password updated")
      navigation.back()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update password")
    },
  })

  const handleSave = useCallback(() => {
    if (isPending) return
    if (!isFormValid) {
      if (newPassword && confirmNewPassword && newPassword !== confirmNewPassword) {
        toast.error("New passwords do not match")
      }
      return
    }
    submitChangePassword()
  }, [confirmNewPassword, isFormValid, isPending, newPassword, submitChangePassword])

  return (
    <SafeNavigationScrollView
      className="flex-1 bg-system-grouped-background"
      Header={
        <NavigationBlurEffectHeaderView
          title="Reset Password"
          headerRight={useCallback(
            () => (
              <UIBarButton
                label="Save"
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
            [handleSave, isFormValid, isPending, labelColor],
          )}
        />
      }
    >
      <GroupedInsetListSectionHeader label="Current Password" />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="py-3">
          <PlainTextField
            autoFocus
            className="w-full"
            hitSlop={10}
            secureTextEntry={true}
            keyboardType="visible-password"
            placeholder="Enter your current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
          />
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader marginSize="small" label="New Password" />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="py-3">
          <PlainTextField
            className="w-full"
            keyboardType="visible-password"
            secureTextEntry={true}
            hitSlop={10}
            placeholder="Enter your new password"
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </GroupedInsetListBaseCell>
      </GroupedInsetListCard>

      <GroupedInsetListSectionHeader marginSize="small" label="Confirm New Password" />
      <GroupedInsetListCard>
        <GroupedInsetListBaseCell className="py-3">
          <PlainTextField
            className="w-full"
            keyboardType="visible-password"
            secureTextEntry={true}
            hitSlop={10}
            placeholder="Enter your new password again"
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
