// Listing locales. The first five match the app's UI languages, so their
// screenshots show a localized app. The rest are store-only (ASO) locales:
// their copy is translated but the app UI in screenshots stays English.

export interface ListingLocale {
  id: string
  // Locale whose app captures the screenshots reuse.
  captureLocale: "en" | "zh-Hans" | "zh-Hant" | "ja" | "fr"
  appStore: string[]
  googlePlay: string[]
  microsoftStore: string[]
}

export const listingLocales: ListingLocale[] = [
  {
    id: "en",
    captureLocale: "en",
    appStore: ["en-US"],
    googlePlay: ["en-US"],
    microsoftStore: ["en-us"],
  },
  {
    id: "zh-Hans",
    captureLocale: "zh-Hans",
    appStore: ["zh-Hans"],
    googlePlay: ["zh-CN"],
    microsoftStore: ["zh-cn"],
  },
  {
    id: "zh-Hant",
    captureLocale: "zh-Hant",
    appStore: ["zh-Hant"],
    googlePlay: ["zh-TW", "zh-HK"],
    microsoftStore: ["zh-tw", "zh-hk"],
  },
  {
    id: "ja",
    captureLocale: "ja",
    appStore: ["ja"],
    googlePlay: ["ja-JP"],
    microsoftStore: ["ja-jp"],
  },
  {
    id: "fr",
    captureLocale: "fr",
    appStore: ["fr-FR"],
    googlePlay: ["fr-FR"],
    microsoftStore: ["fr-fr"],
  },
  {
    id: "de",
    captureLocale: "en",
    appStore: ["de-DE"],
    googlePlay: ["de-DE"],
    microsoftStore: ["de-de"],
  },
  {
    id: "es",
    captureLocale: "en",
    appStore: ["es-ES"],
    googlePlay: ["es-ES"],
    microsoftStore: ["es-es"],
  },
  {
    id: "es-MX",
    captureLocale: "en",
    appStore: ["es-MX"],
    googlePlay: ["es-419"],
    microsoftStore: ["es-mx"],
  },
  {
    id: "pt-BR",
    captureLocale: "en",
    appStore: ["pt-BR"],
    googlePlay: ["pt-BR"],
    microsoftStore: ["pt-br"],
  },
  {
    id: "ko",
    captureLocale: "en",
    appStore: ["ko"],
    googlePlay: ["ko-KR"],
    microsoftStore: ["ko-kr"],
  },
  {
    id: "it",
    captureLocale: "en",
    appStore: ["it"],
    googlePlay: ["it-IT"],
    microsoftStore: ["it-it"],
  },
  {
    id: "ru",
    captureLocale: "en",
    appStore: ["ru"],
    googlePlay: ["ru-RU"],
    microsoftStore: ["ru-ru"],
  },
]

export const appUiLocales = ["en", "zh-Hans", "zh-Hant", "ja", "fr"] as const
export type AppUiLocale = (typeof appUiLocales)[number]
