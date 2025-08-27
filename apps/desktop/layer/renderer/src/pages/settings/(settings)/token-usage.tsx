import { getFeature } from "~/hooks/biz/useFeature"
import { SettingTokenUsage } from "~/modules/settings/tabs/token-usage"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-rada-cute-re"
const priority = (1000 << 1) + 16

// eslint-disable-next-line react-refresh/only-export-components
export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.token_usage",
  priority,
  hideIf: () => !getFeature("ai"),
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingTokenUsage />
    </>
  )
}
