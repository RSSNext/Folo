'use client'

import { useTheme } from 'next-themes'
import { flushSync } from 'react-dom'
import { tv } from 'tailwind-variants'

import { useIsClient } from '~/hooks/common/use-is-client'
import { transitionViewIfSupported } from '~/lib/dom'

const styles = tv({
  base: 'rounded-inherit inline-flex h-[32px] w-[32px] items-center justify-center border-0 text-current',
  variants: {
    status: {
      active: '',
    },
  },
})

const iconClassNames = 'h-4 w-4 text-current'

const SunIcon = () => {
  return (
    <svg
      className={iconClassNames}
      fill="none"
      height="24"
      shapeRendering="geometricPrecision"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="24"
    >
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2" />
      <path d="M12 21v2" />
      <path d="M4.22 4.22l1.42 1.42" />
      <path d="M18.36 18.36l1.42 1.42" />
      <path d="M1 12h2" />
      <path d="M21 12h2" />
      <path d="M4.22 19.78l1.42-1.42" />
      <path d="M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

const SystemIcon = () => {
  return (
    <svg
      className={iconClassNames}
      fill="none"
      height="24"
      shapeRendering="geometricPrecision"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="24"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path d="M8 21h8" />
      <path d="M12 17v4" />
    </svg>
  )
}

const DarkIcon = () => {
  return (
    <svg
      fill="none"
      height="24"
      shapeRendering="geometricPrecision"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      width="24"
      className={iconClassNames}
    >
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  )
}

export const ThemeSwitcher = () => {
  return (
    <div className="relative inline-block">
      <ThemeIndicator />
      <ButtonGroup />
    </div>
  )
}

const ThemeIndicator = () => {
  const { theme } = useTheme()

  const isClient = useIsClient()

  if (!isClient) return null
  if (!theme) return null
  return (
    <div
      className="z-1 absolute top-[4px] size-[32px] rounded-full bg-foreground-500/10 shadow-[0_1px_2px_0_rgba(127.5,127.5,127.5,.2),_0_1px_3px_0_rgba(127.5,127.5,127.5,.1)] duration-200"
      style={{
        left: { light: 4, system: 36, dark: 68 }[theme],
      }}
    />
  )
}

const ButtonGroup = () => {
  const { setTheme } = useTheme()

  const buildThemeTransition = (theme: 'light' | 'dark' | 'system') => {
    transitionViewIfSupported(() => {
      flushSync(() => setTheme(theme))
    })
  }

  return (
    <div className="w-fit-content inline-flex rounded-full border border-slate-200 p-[3px] dark:border-neutral-800">
      <button
        aria-label="Switch to light theme"
        type="button"
        className={styles.base}
        onClick={() => {
          buildThemeTransition('light')
        }}
      >
        <SunIcon />
      </button>
      <button
        aria-label="Switch to system theme"
        className={styles.base}
        type="button"
        onClick={() => {
          buildThemeTransition('system')
        }}
      >
        <SystemIcon />
      </button>
      <button
        aria-label="Switch to dark theme"
        className={styles.base}
        type="button"
        onClick={() => {
          buildThemeTransition('dark')
        }}
      >
        <DarkIcon />
      </button>
    </div>
  )
}
