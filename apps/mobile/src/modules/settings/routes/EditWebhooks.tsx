import { useActionRule } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { useTranslation } from "react-i18next"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetButtonCell,
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Text } from "@/src/components/ui/typography/Text"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

export const EditWebhooksScreen: NavigationControllerView<{
  index: number
}> = ({ index }) => {
  const { t } = useTranslation("settings")
  const rule = useActionRule(index)
  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("actions.edit_webhook")} />}
    >
      <GroupedInsetListSectionHeader label={t("actions.action_card.webhooks")} marginSize="small" />
      <GroupedInsetListCard>
        {rule?.result.webhooks?.map((webhook, webhookIndex) => (
          <GroupedInsetListBaseCell className="flex-row" key={webhookIndex}>
            <PlainTextField
              placeholder="https://"
              inputMode="url"
              value={webhook}
              onChangeText={(value) => {
                actionActions.updateWebhook({
                  index,
                  webhookIndex,
                  value,
                })
              }}
            />
          </GroupedInsetListBaseCell>
        ))}
        <GroupedInsetButtonCell
          label={t("actions.action_card.add")}
          onPress={() => {
            actionActions.addWebhook(index)
          }}
        />
      </GroupedInsetListCard>
      {__DEV__ && <Text>{JSON.stringify(rule?.result.webhooks, null, 2)}</Text>}
    </SafeNavigationScrollView>
  )
}
