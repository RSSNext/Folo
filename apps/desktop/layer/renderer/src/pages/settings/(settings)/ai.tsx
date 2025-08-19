import { getFeature } from "~/hooks/biz/useFeature"
import { SettingAI } from "~/modules/settings/tabs/ai"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-ai-cute-re"
const priority = (1000 << 1) + 15

// eslint-disable-next-line react-refresh/only-export-components
export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.ai",
  priority,
  hideIf: () => !getFeature("ai"),
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingAI />
    </>
  )
}
