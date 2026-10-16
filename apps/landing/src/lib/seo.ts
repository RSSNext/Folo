import type { Metadata } from 'next'

import { defaultLocale, locales } from '~/i18n/routing'

// The locale segments are not all language codes: `jp` is Japanese
const hreflangByLocale: Record<(typeof locales)[number], string> = {
  en: 'en',
  zh: 'zh',
  jp: 'ja',
}

// The default locale has no prefix (`localePrefix: 'as-needed'`)
const getLocalizedPath = (locale: string, path: string) => {
  const prefix = locale === defaultLocale ? '' : `/${locale}`
  if (path === '/') return prefix || '/'
  return `${prefix}${path}`
}

/**
 * The page's own canonical URL in this locale, with the same page in every locale for hreflang.
 * Each page sets it, as a canonical inherited from the layout would point every page at the
 * home page.
 */
export const getLocaleAlternates = (
  locale: string,
  path: string,
): Metadata['alternates'] => ({
  canonical: getLocalizedPath(locale, path),
  languages: {
    ...Object.fromEntries(
      locales.map((item) => [
        hreflangByLocale[item],
        getLocalizedPath(item, path),
      ]),
    ),
    'x-default': getLocalizedPath(defaultLocale, path),
  },
})
