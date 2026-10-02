import { describe, expect, it } from "vitest"

import type { RendererSupportedLanguages } from "./constants"
import { currentSupportedLanguages, ns } from "./constants"
import { defaultResources } from "./default-resource.electron"

const localeFiles = import.meta.glob<Record<string, string>>("@locales/*/*.json", {
  eager: true,
  import: "default",
})

const getLocaleFile = (namespace: string, lang: string) =>
  Object.entries(localeFiles).find(([path]) =>
    path.endsWith(`/locales/${namespace}/${lang}.json`),
  )?.[1]

describe("electron default resources", () => {
  it.each(currentSupportedLanguages)("bundles every %s locale file", (lang) => {
    const resources: Partial<Record<(typeof ns)[number], unknown>> =
      defaultResources[lang as RendererSupportedLanguages]

    for (const namespace of ns) {
      // A namespace without a translation stays out so i18next walks `fallbackLng` instead of
      // showing another language's strings.
      expect(resources[namespace], `${namespace}/${lang}.json`).toBe(getLocaleFile(namespace, lang))
    }
  })
})
