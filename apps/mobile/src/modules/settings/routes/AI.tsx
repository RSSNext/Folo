import type { ByokProviderName, UserByokProviderConfig } from "@follow/shared/settings/interface"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { View } from "react-native"

import { setAISetting, useAISettingSelector } from "@/src/atoms/settings/ai"
import {
  NavigationBlurEffectHeaderView,
  SafeNavigationScrollView,
} from "@/src/components/layouts/views/SafeNavigationScrollView"
import { PlainTextField } from "@/src/components/ui/form/TextField"
import {
  GroupedInsetListCard,
  GroupedInsetListCell,
  GroupedInsetListSectionHeader,
  GroupedOutlineDescription,
} from "@/src/components/ui/grouped/GroupedList"
import { Switch } from "@/src/components/ui/switch/Switch"
import type { NavigationControllerView } from "@/src/lib/navigation/types"

const OPENAI_PROVIDER: ByokProviderName = "openai"

export const AIScreen: NavigationControllerView = () => {
  const { t: tSettings } = useTranslation("settings")
  const tAi = (key: string) => tSettings(key as any)

  const byok = useAISettingSelector((s) => s.byok)

  const enabled = byok?.enabled ?? false
  const providers = byok?.providers ?? []

  const openaiProvider = useMemo<UserByokProviderConfig>(() => {
    return (
      providers.find((item) => item.provider === OPENAI_PROVIDER) ?? { provider: OPENAI_PROVIDER }
    )
  }, [providers])

  const updateByok = (next: { enabled?: boolean; provider?: Partial<UserByokProviderConfig> }) => {
    const currentProviders = byok?.providers ?? []
    const normalizedProviders = [...currentProviders]

    if (next.provider) {
      const index = normalizedProviders.findIndex((item) => item.provider === OPENAI_PROVIDER)
      const mergedProvider: UserByokProviderConfig = {
        provider: OPENAI_PROVIDER,
        ...(index !== -1 ? normalizedProviders[index] : {}),
        ...next.provider,
      }

      if (index !== -1) {
        normalizedProviders[index] = mergedProvider
      } else {
        normalizedProviders.push(mergedProvider)
      }
    }

    setAISetting("byok", {
      enabled: next.enabled ?? enabled,
      providers: normalizedProviders,
    })
  }

  return (
    <SafeNavigationScrollView
      className="bg-system-grouped-background"
      Header={<NavigationBlurEffectHeaderView title={tSettings("titles.ai")} />}
    >
      <GroupedInsetListSectionHeader label={tAi("byok.title")} marginSize="small" />

      <GroupedInsetListCard>
        <GroupedInsetListCell label={tAi("byok.enabled")} description={tAi("byok.description")}>
          <Switch
            size="sm"
            value={enabled}
            onValueChange={(value) => {
              updateByok({ enabled: value })
            }}
          />
        </GroupedInsetListCell>
      </GroupedInsetListCard>

      {enabled ? (
        <>
          <GroupedInsetListSectionHeader label={tAi("byok.providers.title")} />
          <GroupedInsetListCard>
            <GroupedInsetListCell
              label={tAi("byok.providers.form.base_url")}
              leftClassName="flex-none"
              rightClassName="flex-1"
            >
              <View className="flex-1">
                <PlainTextField
                  className="w-full flex-1 text-right text-secondary-label"
                  value={openaiProvider.baseURL ?? ""}
                  onChangeText={(text) => {
                    updateByok({ provider: { baseURL: text || null } })
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder={tAi("byok.providers.form.base_url_placeholder")}
                />
              </View>
            </GroupedInsetListCell>

            <GroupedInsetListCell
              label={tAi("byok.providers.form.api_key")}
              leftClassName="flex-none"
              rightClassName="flex-1"
            >
              <View className="flex-1">
                <PlainTextField
                  className="w-full flex-1 text-right text-secondary-label"
                  value={openaiProvider.apiKey ?? ""}
                  onChangeText={(text) => {
                    updateByok({ provider: { apiKey: text || null } })
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry
                  placeholder={tAi("byok.providers.form.api_key_placeholder")}
                />
              </View>
            </GroupedInsetListCell>
          </GroupedInsetListCard>

          <GroupedOutlineDescription description={tAi("byok.providers.form.api_key_help")} />
          <GroupedOutlineDescription description={tAi("byok.providers.form.base_url_help")} />
        </>
      ) : null}
    </SafeNavigationScrollView>
  )
}
