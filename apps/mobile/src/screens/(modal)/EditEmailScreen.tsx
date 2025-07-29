import { useWhoami } from "@follow/store/user/hooks"
import { userSyncService } from "@follow/store/user/store"
import { useMutation } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { HeaderSubmitTextButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedOutlineDescription,
  GroupedPlainButtonCell,
} from "@/src/components/ui/grouped/GroupedList"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"

export const EditEmailScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")

  const whoami = useWhoami()

  const [email, setEmail] = useState(whoami?.email ?? "")

  const [isDirty, setIsDirty] = useState(false)
  const isValidate = whoami?.emailVerified

  const newEmailIsValid = useMemo(() => {
    return email.match(/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/)
  }, [email])

  const navigation = useNavigation()
  const { mutate: updateEmail, isPending } = useMutation({
    mutationFn: async () => {
      await userSyncService.updateEmail(email)
    },
    onSuccess: () => {
      toast.info("Please check your email inbox to verify your new email")
      navigation.dismiss()
    },
  })

  const [isSendingVerificationEmail, setIsSendingVerificationEmail] = useState(false)

  return (
    <SafeNavigationScrollView
      keyboardShouldPersistTaps="handled"
      Header={
        <NavigationBlurEffectHeaderView
          title={t("profile.edit_email")}
          headerRight={
            <HeaderSubmitTextButton
              isLoading={isPending}
              isValid={!!(email && newEmailIsValid && isDirty)}
              onPress={() => {
                updateEmail()
              }}
            />
          }
        />
      }
      className="bg-system-grouped-background"
    >
      <View className="mt-4 w-full">
        <GroupedInsetListCard>
          <GroupedInsetListCell
            label={t("profile.email.label")}
            rightClassName="flex-1"
            leftClassName="flex-none"
          >
            <PlainTextField
              autoCapitalize="none"
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                setIsDirty(true)
              }}
              placeholder="Enter your email"
              className="text-secondary-label w-full flex-1 text-left"
            />
          </GroupedInsetListCell>
        </GroupedInsetListCard>
        <GroupedOutlineDescription
          description={`${t("profile.email.verify_status", {
            status: isValidate ? t("profile.email.verified") : t("profile.email.unverified"),
          })}\n\n${t("profile.email.change_note")}`}
        />

        {/* Buttons */}

        {!isValidate && (
          <GroupedInsetListCard className="mt-6">
            <GroupedPlainButtonCell
              disabled={isSendingVerificationEmail}
              label={
                isSendingVerificationEmail ? "Verification Email Sent" : "Send Verification Email"
              }
              onPress={() => {
                setIsSendingVerificationEmail(true)
                userSyncService.sendVerificationEmail().then(() => {
                  toast.success("Verification email sent")
                })
              }}
            />
          </GroupedInsetListCard>
        )}
      </View>
    </SafeNavigationScrollView>
  )
}
