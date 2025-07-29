import { useAtomValue } from "jotai"

import { themeAtom, useDarkQuery } from "./internal/for-theme"

function useDarkWebApp() {
  const systemIsDark = useDarkQuery()
  const mode = useAtomValue(themeAtom)
  return mode === "dark" || (mode === "system" && systemIsDark)
}

export const useIsDark = useDarkWebApp

export const useThemeAtomValue = () => useAtomValue(themeAtom)

export type { ColorMode } from "./internal/for-theme"
export { useDarkQuery } from "./internal/for-theme"
