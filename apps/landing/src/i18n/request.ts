import { getRequestConfig } from 'next-intl/server'

type RequestConfigParams = {
  locale?: string
  requestLocale?: Promise<string | undefined> | string | undefined
}

const SUPPORTED_LOCALES = ['en', 'zh', 'jp'] as const
const DEFAULT_LOCALE = 'en'
const localeSet = new Set<string>(SUPPORTED_LOCALES)

export default getRequestConfig(async (params?: RequestConfigParams) => {
  const localeFromParam = params?.locale
  const requestLocaleValue = params?.requestLocale
  const localeFromRequest = requestLocaleValue
    ? await requestLocaleValue
    : undefined
  const requestedLocale = localeFromParam || localeFromRequest
  const localeValue =
    requestedLocale && localeSet.has(requestedLocale)
      ? requestedLocale
      : DEFAULT_LOCALE

  return {
    locale: localeValue,
    messages: (await import(`../messages/${localeValue}.json`)).default,
  }
})
