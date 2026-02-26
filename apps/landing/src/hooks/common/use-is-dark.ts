import { useTheme } from 'next-themes'

export const useIsDark = () => {
  const { theme, systemTheme } = useTheme()
  return theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
}
