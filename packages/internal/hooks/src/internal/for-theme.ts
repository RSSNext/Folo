import { getStorageNS } from "@follow/utils/ns"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"
import { useMediaQuery } from "usehooks-ts"

export const useDarkQuery = () => useMediaQuery("(prefers-color-scheme: dark)")
export type ColorMode = "light" | "dark" | "system"

declare const window: any
export const themeAtom = !window.electron
  ? atomWithStorage(getStorageNS("color-mode"), "system" as ColorMode, undefined, {
      getOnInit: true,
    })
  : atom("system" as ColorMode)
