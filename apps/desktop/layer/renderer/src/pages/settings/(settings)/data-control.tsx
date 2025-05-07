import { MaterialSymbolsDatabaseOutline } from "@follow/components/icons/Database.js"

import { SettingDataControl } from "~/modules/settings/tabs/data-control"
import { SettingsTitle } from "~/modules/settings/title"
import { defineSettingPageData } from "~/modules/settings/utils"

const priority = 1025

export const loader = defineSettingPageData({
  icon: <MaterialSymbolsDatabaseOutline />,
  name: "titles.data_control",
  priority,
})

export function Component() {
  return (
    <>
      <SettingsTitle />
      <SettingDataControl />
    </>
  )
}
