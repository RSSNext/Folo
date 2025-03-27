import { useMutation } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { View } from "react-native"

import { HeaderSubmitButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeader,
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
import { useWhoami } from "@/src/store/user/hooks"
import { userSyncService } from "@/src/store/user/store"

export const EditEmailScreen: NavigationControllerView = () => {
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
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader
        title="Edit Email"
        headerRight={
          <HeaderSubmitButton
            isLoading={isPending}
            isValid={!!(email && newEmailIsValid && isDirty)}
            onPress={() => {
              updateEmail()
            }}
          />
        }
      />

      <View className="mt-4 w-full">
        <GroupedInsetListCard>
          <GroupedInsetListCell label="Email" rightClassName="flex-1" leftClassName="flex-none">
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
          description={`Your email is ${isValidate ? "verified" : "not verified"}. \n\nIf you want to change your email, you should verify your new email.`}
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
                userSyncService.sendVerificationEmail()
              }}
            />
          </GroupedInsetListCard>
        )}
      </View>
    </SafeNavigationScrollView>
  )
}
