import { router } from "expo-router"

import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/common/SafeNavigationScrollView"
import {
  GroupedInsetListCard,
  GroupedInsetListNavigationLink,
} from "@/src/components/ui/grouped/GroupedList"

export const PrivacyScreen = () => {
  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="Privacy" />
      <GroupedInsetListCard className="mt-4">
        <GroupedInsetListNavigationLink
          label="Terms"
          onPress={() => {
            router.push("/terms")
          }}
        />
      </GroupedInsetListCard>
    </SafeNavigationScrollView>
  )
}
