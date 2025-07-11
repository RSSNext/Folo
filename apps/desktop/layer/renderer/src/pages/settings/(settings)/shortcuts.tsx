import { isMobile } from "@follow/components/hooks/useMobile.js"

import { ShortcutSetting } from "~/modules/settings/tabs/shortcut"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-hotkey-cute-re"
const priority = (1000 << 1) + 40

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.shortcuts",
  priority,
  hideIf: () => isMobile(),
})
export function Component() {
  return (
    <>
      <SettingsTitle />
      <ShortcutSetting />
    </>
  )
}
