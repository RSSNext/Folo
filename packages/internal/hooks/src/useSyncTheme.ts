import { nextFrame } from "@follow/utils/dom"
import { jotaiStore } from "@follow/utils/jotai"
import { useAtomValue } from "jotai"
import { useCallback, useLayoutEffect } from "react"

import type { ColorMode } from "./internal/for-theme"
import { themeAtom, useDarkQuery } from "./internal/for-theme"

export const useSyncThemeWebApp = () => {
  const colorMode = useAtomValue(themeAtom)
  const systemIsDark = useDarkQuery()
  useLayoutEffect(() => {
    const realColorMode: Exclude<ColorMode, "system"> =
      colorMode === "system" ? (systemIsDark ? "dark" : "light") : colorMode
    document.documentElement.dataset.theme = realColorMode
    disableTransition(["[role=switch]>*"])()
  }, [colorMode, systemIsDark])
}

export const internal_useSetTheme = () =>
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useCallback((theme: ColorMode) => jotaiStore.set(themeAtom, theme), [])

export function disableTransition(disableTransitionExclude: string[] = []) {
  const css = document.createElement("style")
  css.append(
    document.createTextNode(
      `
*${disableTransitionExclude.map((s) => `:not(${s})`).join("")} {
  -webkit-transition: none !important;
  -moz-transition: none !important;
  -o-transition: none !important;
  -ms-transition: none !important;
  transition: none !important;
}
      `,
    ),
  )
  document.head.append(css)

  return () => {
    // Force restyle
    ;(() => window.getComputedStyle(document.body))()

    // Wait for next tick before removing
    nextFrame(() => {
      css.remove()
    })
  }
}
