import { userSyncService } from "@follow/store/user/store"
import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { View } from "react-native"

import { HeaderSubmitButton } from "@/src/components/layouts/header/HeaderElements"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedOutlineDescription,
} from "@/src/components/ui/grouped/GroupedList"
import { getBizFetchErrorMessage } from "@/src/lib/api-fetch"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"

export const InvitationScreen: NavigationControllerView = () => {
  const [code, setCode] = useState("")

  const navigation = useNavigation()
  const { mutate: applyInvitationCode, isPending } = useMutation({
    mutationFn: async () => {
      await userSyncService.applyInvitationCode(code)
    },
    onSuccess: () => {
      navigation.dismiss()
    },
    onError: (error) => {
      toast.error(getBizFetchErrorMessage(error))
    },
  })

  return (
    <SafeNavigationScrollView
      Header={
        <NavigationBlurEffectHeaderView
          title="Enter Invitation Code"
          headerRight={
            <HeaderSubmitButton
              isLoading={isPending}
              isValid={!!code}
              onPress={() => {
                applyInvitationCode()
              }}
            />
          }
        />
      }
      className="bg-system-grouped-background"
    >
      <View className="mt-8 w-full">
        <GroupedInsetListCard>
          <GroupedInsetListCell
            label="Invitation Code"
            rightClassName="flex-1"
            leftClassName="flex-none"
          >
            <PlainTextField
              autoFocus={true}
              value={code}
              onChangeText={(text) => {
                setCode(text)
              }}
              className="text-secondary-label w-full flex-1 text-left"
            />
          </GroupedInsetListCell>
        </GroupedInsetListCard>
        <GroupedOutlineDescription description="During the public testing phase, you need an invitation code to use this feature." />
      </View>
    </SafeNavigationScrollView>
  )
}
