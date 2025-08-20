import type { PrimitiveAtom } from "jotai"
import { atom } from "jotai"
import { createContext } from "react"

import { createAtomHooks } from "~/lib/jotai"

export const [, , useSettingTab, useSetSettingTab, getSettingTab, setSettingTab] = createAtomHooks(
  atom(""),
)

export const SettingModalContentPortalableContext = createContext<PrimitiveAtom<HTMLElement>>(
  atom(null as any),
)
