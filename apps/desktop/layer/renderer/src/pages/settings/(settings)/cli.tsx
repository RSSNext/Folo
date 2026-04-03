import { IN_ELECTRON } from "@follow/shared/constants"

import { Android2CuteReIcon } from "~/modules/settings/icons/Android2CuteReIcon"
import { SettingCli } from "~/modules/settings/tabs/cli"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const priority = (1000 << 1) + 25

export const loader = defineSettingPageData({
  icon: <Android2CuteReIcon />,
  headerIcon: <Android2CuteReIcon className="size-5 text-accent" />,
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
