import dayjs from "dayjs"
import i18next from "i18next"
import { afterAll, describe, expect, it, vi } from "vitest"

vi.mock("expo-localization", () => ({ getLocales: () => [] }))
vi.mock("@/src/@types/constants", () => ({
  currentSupportedLanguages: ["en", "ja"],
  dayjsLocaleImportMap: {
    en: ["en", () => import("dayjs/locale/en")],
    ja: ["ja", () => import("dayjs/locale/ja")],
  },
  defaultNS: "default",
  ns: ["default"],
}))
vi.mock("@/src/@types/default-resource", () => ({ defaultResources: {} }))
vi.mock("../atoms/settings/general", () => ({
  getGeneralSettings: () => ({ language: "en" }),
}))
vi.mock("./e2e-config", () => ({ getE2ELanguage: () => null }))

const { changeAppLanguage } = await import("./i18n")

afterAll(() => {
  dayjs.locale("en")
})

describe("changeAppLanguage", () => {
  it("switches the dayjs locale before components re-render for the new language", async () => {
    await i18next.init({ lng: "en", resources: { en: {}, ja: {} } })
    const dayjsLocales: string[] = []
    const recordDayjsLocale = () => {
      dayjsLocales.push(dayjs.locale())
    }
    i18next.on("languageChanged", recordDayjsLocale)

    await changeAppLanguage("ja")

    i18next.off("languageChanged", recordDayjsLocale)
    expect(i18next.language).toBe("ja")
    expect(dayjsLocales).toEqual(["ja"])
  })
})
