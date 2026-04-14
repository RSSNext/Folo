import type { SpotlightRule } from "@follow/shared/spotlight"
import { defaultSpotlightColor } from "@follow/shared/spotlight"
import { nanoid } from "nanoid/non-secure"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { setSpotlightSetting, useSpotlightSettingKey } from "@/src/atoms/settings/spotlight"
import { UINavigationHeaderActionButton } from "@/src/components/layouts/header/NavigationHeader"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import {
  GroupedInsetListActionCell,
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
  GroupedOutlineDescription,
} from "@/src/components/ui/grouped/GroupedList"
import { Text } from "@/src/components/ui/typography/Text"
import { AddCuteReIcon } from "@/src/icons/add_cute_re"
import { Navigation } from "@/src/lib/navigation/Navigation"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { useColor } from "@/src/theme/colors"

import { EditSpotlightRuleScreen } from "./EditSpotlightRule"

const createSpotlightRule = (): SpotlightRule => ({
  id: nanoid(),
  enabled: true,
  pattern: "",
  patternType: "keyword",
  caseSensitive: false,
  color: defaultSpotlightColor,
})

const createEditSpotlightRuleView = (ruleId: string) => {
  const EditSpotlightRuleView: NavigationControllerView = function SpotlightRuleEditorView() {
    return <EditSpotlightRuleScreen ruleId={ruleId} />
  }
  EditSpotlightRuleView.id = `spotlight-rule-${ruleId}`
  EditSpotlightRuleView.displayName = `SpotlightRuleEditorView(${ruleId})`
  return EditSpotlightRuleView
}

export const SpotlightScreen: NavigationControllerView = () => {
  const { t } = useTranslation("settings")
  const rules = useSpotlightSettingKey("spotlights")

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      contentContainerClassName="mt-6"
      Header={
        <NavigationBlurEffectHeaderView
          title={t("titles.spotlight")}
          headerRight={() => <AddSpotlightRuleButton />}
        />
      }
    >
      <GroupedInsetListSectionHeader label={t("titles.spotlight")} marginSize="small" />
      <GroupedInsetListCard>
        {rules.length === 0 ? (
          <View className="px-4 py-5">
            <Text className="text-sm text-secondary-label">{t("spotlight.add_rule")}</Text>
          </View>
        ) : (
          rules.map((rule) => (
            <GroupedInsetListActionCell
              key={rule.id}
              label={rule.pattern.trim() || t("spotlight.pattern")}
              description={[
                t(rule.patternType === "keyword" ? "spotlight.keyword" : "spotlight.regex"),
                rule.caseSensitive ? t("spotlight.case_sensitive") : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              onPress={() => {
                Navigation.rootNavigation.presentControllerView(
                  createEditSpotlightRuleView(rule.id),
                )
              }}
              prefix={<SpotlightRuleColorDot color={rule.color} />}
            />
          ))
        )}
      </GroupedInsetListCard>
      <GroupedOutlineDescription description={t("spotlight.add_rule")} />
    </SafeNavigationScrollView>
  )
}

const SpotlightRuleColorDot = ({ color }: { color: string }) => {
  return (
    <View
      className="size-3 rounded-full border border-black/5"
      style={{
        backgroundColor: color,
      }}
    />
  )
}

const AddSpotlightRuleButton = () => {
  const labelColor = useColor("label")
  const rules = useSpotlightSettingKey("spotlights")
  const handlePress = useCallback(() => {
    const rule = createSpotlightRule()
    setSpotlightSetting("spotlights", [...rules, rule])
    Navigation.rootNavigation.presentControllerView(createEditSpotlightRuleView(rule.id))
  }, [rules])

  return (
    <UINavigationHeaderActionButton onPress={handlePress}>
      <AddCuteReIcon height={20} width={20} color={labelColor} />
    </UINavigationHeaderActionButton>
  )
}
