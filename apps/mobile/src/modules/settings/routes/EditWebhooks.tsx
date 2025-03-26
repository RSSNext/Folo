import { Text } from "react-native"

import {
  NavigationBlurEffectHeader,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetButtonCell,
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useActionRule } from "@/src/store/action/hooks"
import { actionActions } from "@/src/store/action/store"

export const EditWebhooksScreen: NavigationControllerView<{ index: number }> = ({ index }) => {
  const rule = useActionRule(index)

  return (
    <SafeNavigationScrollView className="bg-system-grouped-background">
      <NavigationBlurEffectHeader title="Edit Webhooks" />
      <GroupedInsetListSectionHeader label="Webhooks" marginSize="small" />
      <GroupedInsetListCard>
        {rule?.result.webhooks?.map((webhook, webhookIndex) => (
          <GroupedInsetListBaseCell className="flex-row" key={webhookIndex}>
            <PlainTextField
              placeholder="https://"
              inputMode="url"
              value={webhook}
              onChangeText={(value) => {
                actionActions.updateWebhook({ index, webhookIndex, value })
              }}
            />
          </GroupedInsetListBaseCell>
        ))}
        <GroupedInsetButtonCell
          label="Add"
          onPress={() => {
            actionActions.addWebhook(index)
          }}
        />
      </GroupedInsetListCard>
      {__DEV__ && <Text>{JSON.stringify(rule?.result.webhooks, null, 2)}</Text>}
    </SafeNavigationScrollView>
  )
}
