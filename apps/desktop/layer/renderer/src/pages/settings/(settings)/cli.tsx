import { IN_ELECTRON } from "@follow/shared/constants"

import { SettingCli } from "~/modules/settings/tabs/cli"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const iconName = "i-mgc-terminal-cute-re"
const priority = (1000 << 1) + 25

export const loader = defineSettingPageData({
  icon: iconName,
  name: "titles.cli",
  priority,
  hideIf: () => !IN_ELECTRON,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingCli />
    </>
  )
}
