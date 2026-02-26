import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale, requestLocale }) => {
  const localeValue = locale || (await requestLocale) || 'en'

  return {
    locale: localeValue,
    messages: (await import(`../messages/${localeValue}.json`)).default,
  }
})
