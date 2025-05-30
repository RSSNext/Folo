import { Chain } from "@follow/utils/chain"
import { EventBus } from "@follow/utils/event-bus"
import { jotaiStore } from "@follow/utils/jotai"
import { getStorageNS } from "@follow/utils/ns"
import i18next from "i18next"
import { atom } from "jotai"
import { initReactI18next } from "react-i18next"

import { defaultNS, ns } from "./@types/constants"
import { defaultResources } from "./@types/default-resource"
import { getGeneralSettings } from "./atoms/settings/general"

export const i18nAtom = atom(i18next)

export const langChain = new Chain()

export class LocaleCache {
  static shared = new LocaleCache()
  private getKey(lang: string) {
    return getStorageNS(`locale-${lang}`)
  }
  get(lang: string) {
    const key = this.getKey(lang)
    const cache = localStorage.getItem(key)
    if (!cache) return null
    return JSON.parse(cache)
  }
  set(lang: string) {
    const key = this.getKey(lang)
    const mergedResources = {} as any
    for (const nsKey of ns) {
      const nsResources = i18next.getResourceBundle(lang, nsKey)
      mergedResources[nsKey] = nsResources
    }
    localStorage.setItem(key, JSON.stringify(mergedResources))
  }
}

export const fallbackLanguage = "en"
export const initI18n = async () => {
  const i18next = jotaiStore.get(i18nAtom)

  const lang = getGeneralSettings().language!

  const mergedResources = {
    ...defaultResources,
  }

  let cache = null as any
  if (!import.meta.env.DEV) {
    cache = LocaleCache.shared.get(lang)
    if (cache) {
      mergedResources[lang as keyof typeof mergedResources] = cache
    }
  }

  await i18next.use(initReactI18next).init({
    ns,
    lng: cache ? lang : fallbackLanguage,
    fallbackLng: {
      default: [fallbackLanguage],
      "zh-TW": ["zh-CN", fallbackLanguage],
    },
    defaultNS,
    debug: import.meta.env.DEV,

    resources: mergedResources,
  })
}

if (import.meta.hot) {
  import.meta.hot.on(
    "i18n-update",
    async ({ file, content }: { file: string; content: string }) => {
      const resources = JSON.parse(content)
      const i18next = jotaiStore.get(i18nAtom)

      const nsName = file.match(/locales\/(.+?)\//)?.[1]

      if (!nsName) return
      const lang = file.split("/").pop()?.replace(".json", "")
      if (!lang) return
      i18next.addResourceBundle(lang, nsName, resources, true, true)

      console.info("reload", lang, nsName)
      await i18next.reloadResources(lang, nsName)

      import.meta.env.DEV && EventBus.dispatch("I18N_UPDATE", "")
    },
  )
}

declare module "@follow/utils/event-bus" {
  interface CustomEvent {
    I18N_UPDATE: string
  }
}
