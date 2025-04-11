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

export const ResetPassword = () => {
  const labelColor = useColor("label")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")

  const { mutateAsync: changePasswordAsync, isPending } = useMutation({
    mutationFn: () => {
      return changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })
    },
  })

  const handleSave = useCallback(() => {
    return changePasswordAsync()
  }, [changePasswordAsync])

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background flex-1"
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
                disabled={
                  !currentPassword ||
                  !newPassword ||
                  !confirmNewPassword ||
                  newPassword !== confirmNewPassword
                }
                onPress={handleSave}
              />
            ),
            [confirmNewPassword, currentPassword, handleSave, isPending, labelColor, newPassword],
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
