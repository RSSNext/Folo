import { atom } from "jotai"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useSettingTab, useSetSettingTab, getSettingTab, setSettingTab] = createAtomHooks(
  atom(""),
)
