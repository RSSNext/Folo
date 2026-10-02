import { z } from "zod"
import en from "zod/v4/locales/en.js"
import fr from "zod/v4/locales/fr.js"
import ja from "zod/v4/locales/ja.js"
import zhCN from "zod/v4/locales/zh-CN.js"
import zhTW from "zod/v4/locales/zh-TW.js"

const zodLocales: Record<string, typeof en> = {
  en,
  "zh-CN": zhCN,
  "zh-TW": zhTW,
  ja,
  "fr-FR": fr,
}

// Keeps zod's built-in validation messages (e.g. `.email()`, `.min()`) in the app language
export const applyZodLocale = (language: string) => {
  z.config((zodLocales[language] ?? en)())
}
