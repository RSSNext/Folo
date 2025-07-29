import { SettingAI } from "~/modules/settings/tabs/ai"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-ai-cute-re"
const priority = (1000 << 1) + 15

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.ai",
  priority,
  hideIf: (_ctx, serverConfigs) => !serverConfigs?.AI_CHAT_ENABLED,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingAI />
    </>
  )
}
