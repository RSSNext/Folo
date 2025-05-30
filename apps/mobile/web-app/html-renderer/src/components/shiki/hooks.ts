import { useIsDark } from "@follow/hooks"

export const useShikiDefaultTheme = () => {
  const isDark = useIsDark()

  return isDark ? "github-dark" : "github-light"
}
