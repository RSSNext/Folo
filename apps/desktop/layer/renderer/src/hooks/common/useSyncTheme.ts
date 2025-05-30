import type { ColorMode } from "@follow/hooks"
import {
  disableTransition,
  internal_useSetTheme,
  useDarkQuery,
  useSyncThemeWebApp,
} from "@follow/hooks"
import { IN_ELECTRON } from "@follow/shared/constants"
import { useCallback, useLayoutEffect } from "react"

import { tipcClient } from "~/lib/client"

const useSyncThemeElectron = () => {
  const appIsDark = useDarkQuery()
  const setTheme = internal_useSetTheme()
  useLayoutEffect(() => {
    let isMounted = true
    tipcClient?.getAppearance().then((appearance) => {
      if (!isMounted) return
      setTheme(appearance)
      disableTransition(["[role=switch]>*"])()

      document.documentElement.dataset.theme =
        appearance === "system" ? (appIsDark ? "dark" : "light") : appearance
    })
    return () => {
      isMounted = false
    }
  }, [appIsDark, setTheme])
}

export const useSyncTheme = IN_ELECTRON ? useSyncThemeElectron : useSyncThemeWebApp

export const useSetTheme = () => {
  const setTheme = internal_useSetTheme()
  return useCallback(
    (colorMode: ColorMode) => {
      setTheme(colorMode)

      if (IN_ELECTRON) {
        tipcClient?.setAppearance(colorMode)
      }
    },
    [setTheme],
  )
}
