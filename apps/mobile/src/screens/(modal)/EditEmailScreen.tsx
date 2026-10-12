import { useWhoami } from "@follow/store/user/hooks"
import { userSyncService } from "@follow/store/user/store"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
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
import { Text } from "@/src/components/ui/typography/Text"
import { useTouchOnTypingPause } from "@/src/hooks/useTouchOnTypingPause"
import { isValidEmail } from "@/src/lib/email"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"

export const EditEmailScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")

  const whoami = useWhoami()

  const [email, setEmail] = useState(whoami?.email ?? "")

  const [isDirty, setIsDirty] = useState(false)
  // Set once the field is left or typing pauses, so the hint does not interrupt typing
  const [isEmailTouched, setIsEmailTouched] = useState(false)
  const isValidate = whoami?.emailVerified

  const newEmailIsValid = isValidEmail(email)
  useTouchOnTypingPause(isDirty ? email : "", !newEmailIsValid, setIsEmailTouched)

  const navigation = useNavigation()
  const { mutate: updateEmail, isPending } = useMutation({
    mutationFn: async () => {
      await userSyncService.updateEmail(email)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("profile.email.update_failed"))
    },
    onSuccess: () => {
      toast.info(t("profile.email.changed_verification_sent"))
      navigation.dismiss()
    },
  })

  const [isSendingVerificationEmail, setIsSendingVerificationEmail] = useState(false)
  const [hasSentVerificationEmail, setHasSentVerificationEmail] = useState(false)

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
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              onChangeText={(text) => {
                setEmail(text)
                setIsDirty(true)
              }}
              onBlur={() => setIsEmailTouched(true)}
              placeholder={t("profile.email.placeholder")}
              className="w-full flex-1 text-left text-secondary-label"
            />
          </GroupedInsetListCell>
        </GroupedInsetListCard>
        {isDirty && isEmailTouched && !!email && !newEmailIsValid && (
          <Text className="mx-9 mt-2 text-xs text-red">
            {t("validation.invalid_email", { ns: "common" })}
          </Text>
        )}
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
                isSendingVerificationEmail
                  ? t("profile.email.sending_verification")
                  : hasSentVerificationEmail
                    ? t("profile.email.verification_sent")
                    : t("profile.email.send_verification")
              }
              onPress={() => {
                setIsSendingVerificationEmail(true)
                userSyncService
                  .sendVerificationEmail()
                  .then(() => {
                    setHasSentVerificationEmail(true)
                    toast.success(t("profile.email.verification_sent"))
                  })
                  .catch((error) => {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : t("profile.email.send_verification_failed"),
                    )
                  })
                  .finally(() => {
                    setIsSendingVerificationEmail(false)
                  })
              }}
            />
          </GroupedInsetListCard>
        )}
      </View>
    </SafeNavigationScrollView>
  )
}
