import { useActionRule } from "@follow/store/action/hooks"
import { actionActions } from "@follow/store/action/store"
import { useTranslation } from "react-i18next"
import { Text } from "react-native"

import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListBaseCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
  GroupedPlainButtonCell,
} from "@/src/components/ui/grouped/GroupedList"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

export const EditRewriteRulesScreen: NavigationControllerView<{ index: number }> = ({ index }) => {
  const { t } = useTranslation("settings")
  const rule = useActionRule(index)

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={t("actions.edit_rewrite_rule")} />}
    >
      <GroupedInsetListSectionHeader
        label={t("actions.action_card.rewrite_rules")}
        marginSize="small"
      />
      {rule?.result.rewriteRules?.map((rewriteRule, rewriteRuleIndex) => (
        <GroupedInsetListCard key={rewriteRuleIndex} className="mb-4">
          <GroupedInsetListBaseCell className="flex-row">
            <Text className="text-label">{t("actions.action_card.from")}</Text>
            <PlainTextField
              className="w-full flex-1 text-right"
              value={rewriteRule.from}
              onChangeText={(value) => {
                actionActions.updateRewriteRule({
                  index,
                  rewriteRuleIndex,
                  key: "from",
                  value,
                })
              }}
            />
          </GroupedInsetListBaseCell>
          <GroupedInsetListBaseCell className="flex-row">
            <Text className="text-label">{t("actions.action_card.to")}</Text>
            <PlainTextField
              className="w-full flex-1 text-right"
              value={rewriteRule.to}
              onChangeText={(value) => {
                actionActions.updateRewriteRule({
                  index,
                  rewriteRuleIndex,
                  key: "to",
                  value,
                })
              }}
            />
          </GroupedInsetListBaseCell>
        </GroupedInsetListCard>
      ))}
      <GroupedInsetListCard>
        <GroupedPlainButtonCell
          label={t("actions.action_card.add")}
          onPress={() => {
            actionActions.addRewriteRule(index)
          }}
        />
      </GroupedInsetListCard>
      {__DEV__ && <Text>{JSON.stringify(rule?.result.rewriteRules, null, 2)}</Text>}
    </SafeNavigationScrollView>
  )
}
