import {
  defaultSpotlightColor,
  getSpotlightColorChoices,
  moveSpotlightRule,
} from "@follow/shared/spotlight"
import { validateSpotlightPattern } from "@follow/utils/spotlight"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { ViewStyle } from "react-native"
import { Pressable, View } from "react-native"

import { setSpotlightSetting, useSpotlightSettingKey } from "@/src/atoms/settings/spotlight"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { Select } from "@/src/components/ui/form/Select"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetButtonCell,
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { Switch } from "@/src/components/ui/switch/Switch"
import { Text } from "@/src/components/ui/typography/Text"
import { CheckFilledIcon } from "@/src/icons/check_filled"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { accentColor } from "@/src/theme/colors"

export const EditSpotlightRuleScreen: NavigationControllerView<{
  ruleId: string
}> = ({ ruleId }) => {
  const { t } = useTranslation("settings")
  const navigation = useNavigation()
  const rules = useSpotlightSettingKey("spotlights")
  const ruleIndex = rules.findIndex((rule) => rule.id === ruleId)
  const rule = ruleIndex === -1 ? undefined : rules[ruleIndex]
  const colorChoices = useMemo(
    () => getSpotlightColorChoices(rule?.color ?? defaultSpotlightColor),
    [rule?.color],
  )

  const updateRule = (updater: (currentRule: (typeof rules)[number]) => (typeof rules)[number]) => {
    if (ruleIndex === -1) return

    setSpotlightSetting(
      "spotlights",
      rules.map((currentRule, index) => (index === ruleIndex ? updater(currentRule) : currentRule)),
    )
  }

  const moveRule = (direction: -1 | 1) => {
    if (ruleIndex === -1) return
    setSpotlightSetting("spotlights", moveSpotlightRule(rules, ruleIndex, direction))
  }

  const deleteRule = () => {
    if (ruleIndex === -1) return

    setSpotlightSetting(
      "spotlights",
      rules.filter((_, index) => index !== ruleIndex),
    )
    navigation.dismiss()
  }

  const validation = useMemo(
    () => validateSpotlightPattern(rule?.pattern ?? "", rule?.patternType ?? "keyword"),
    [rule?.pattern, rule?.patternType],
  )

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      contentContainerClassName="mt-6"
      Header={<NavigationBlurEffectHeaderView title={t("titles.spotlight")} />}
    >
      {!rule ? (
        <View className="px-6 py-4">
          <Text className="text-sm text-secondary-label">{t("spotlight.pattern")}</Text>
        </View>
      ) : (
        <View className="gap-6">
          <View>
            <GroupedInsetListSectionHeader label={t("spotlight.pattern")} marginSize="small" />
            <GroupedInsetListCard>
              <GroupedInsetListCell label={t("spotlight.pattern")} rightClassName="flex-1">
                <View className="flex-1">
                  <PlainTextField
                    className="w-full text-right text-label"
                    value={rule.pattern}
                    selectionColor={accentColor}
                    onChangeText={(pattern) => {
                      updateRule((currentRule) => ({ ...currentRule, pattern }))
                    }}
                  />
                </View>
              </GroupedInsetListCell>
            </GroupedInsetListCard>
            {rule.patternType === "regex" && !validation.valid && (
              <View className="px-6 pt-2">
                <Text className="text-sm text-red">
                  {t("spotlight.invalid_regex", { error: validation.error })}
                </Text>
              </View>
            )}
          </View>

          <View>
            <GroupedInsetListSectionHeader label={t("spotlight.type")} marginSize="small" />
            <GroupedInsetListCard>
              <GroupedInsetListCell label={t("spotlight.type")} rightClassName="w-[160px]">
                <Select
                  value={rule.patternType}
                  onValueChange={(patternType) => {
                    if (patternType !== "keyword" && patternType !== "regex") return
                    updateRule((currentRule) => ({ ...currentRule, patternType }))
                  }}
                  options={[
                    { label: t("spotlight.keyword"), value: "keyword" as const },
                    { label: t("spotlight.regex"), value: "regex" as const },
                  ]}
                />
              </GroupedInsetListCell>
            </GroupedInsetListCard>
          </View>

          <View>
            <GroupedInsetListSectionHeader label={t("spotlight.color")} marginSize="small" />
            <GroupedInsetListCard>
              <View className="flex-row flex-wrap gap-3 px-4 py-4">
                {colorChoices.map((preset, index) => {
                  const isSelected = preset.value.toUpperCase() === rule.color.toUpperCase()

                  return (
                    <Pressable
                      key={preset.value}
                      accessibilityLabel={`Select highlight color ${index + 1}`}
                      className="relative"
                      onPress={() => {
                        updateRule((currentRule) => ({ ...currentRule, color: preset.value }))
                      }}
                    >
                      <View
                        className="size-10 rounded-full border border-black/5"
                        style={getSpotlightSwatchStyle(preset.value, isSelected)}
                      />

                      {isSelected && (
                        <View className="absolute -bottom-1 -right-1 size-5 items-center justify-center rounded-full bg-blue">
                          <CheckFilledIcon height={14} width={14} color="#FFFFFF" />
                        </View>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            </GroupedInsetListCard>
          </View>

          <View>
            <GroupedInsetListSectionHeader label={t("spotlight.enabled")} marginSize="small" />
            <GroupedInsetListCard>
              <GroupedInsetListCell label={t("spotlight.enabled")}>
                <Switch
                  size="sm"
                  value={rule.enabled}
                  onValueChange={(enabled) => {
                    updateRule((currentRule) => ({ ...currentRule, enabled }))
                  }}
                />
              </GroupedInsetListCell>
            </GroupedInsetListCard>
          </View>

          <View>
            <GroupedInsetListSectionHeader
              label={t("spotlight.case_sensitive")}
              marginSize="small"
            />
            <GroupedInsetListCard>
              <GroupedInsetListCell label={t("spotlight.case_sensitive")}>
                <Switch
                  size="sm"
                  value={rule.caseSensitive}
                  onValueChange={(caseSensitive) => {
                    updateRule((currentRule) => ({ ...currentRule, caseSensitive }))
                  }}
                />
              </GroupedInsetListCell>
            </GroupedInsetListCard>
          </View>

          <View>
            <GroupedInsetListSectionHeader label={t("titles.spotlight")} marginSize="small" />
            <GroupedInsetListCard>
              <GroupedInsetButtonCell
                label={t("spotlight.move_up")}
                disabled={ruleIndex === 0}
                onPress={() => moveRule(-1)}
              />
              <GroupedInsetButtonCell
                label={t("spotlight.move_down")}
                disabled={ruleIndex === rules.length - 1}
                onPress={() => moveRule(1)}
              />
              <GroupedInsetButtonCell
                label={t("words.delete", { ns: "common" })}
                style="destructive"
                onPress={deleteRule}
              />
            </GroupedInsetListCard>
          </View>
        </View>
      )}
    </SafeNavigationScrollView>
  )
}

const getSpotlightSwatchStyle = (color: string, isSelected: boolean): ViewStyle => ({
  backgroundColor: color,
  transform: [{ scale: isSelected ? 1.05 : 1 }],
  shadowColor: isSelected ? accentColor : "#00000020",
  shadowOpacity: isSelected ? 0.3 : 0.12,
  shadowRadius: isSelected ? 0 : 4,
  shadowOffset: { width: 0, height: 2 },
})
