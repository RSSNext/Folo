import { SettingShortcuts } from "~/modules/command/shortcuts/SettingShortcuts"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-hotkey-cute-re"
const priority = 1080

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.shortcuts",
  priority,
})
export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingShortcuts />
    </>
  )
}
