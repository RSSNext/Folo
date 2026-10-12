import i18next from "i18next"
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

// zod's own texts name types and patterns ("expected string to have >=8 characters"), so the
// common text checks get plain messages; anything else keeps zod's translated text
const formMessages: z.core.$ZodErrorMap = (issue) => {
  switch (issue.code) {
    case "too_small": {
      if (issue.origin !== "string") return
      const count = Number(issue.minimum)
      if (issue.exact) return i18next.t("validation.exact_length", { ns: "common", count })
      if (count <= 1) return i18next.t("validation.required", { ns: "common" })
      return i18next.t("validation.too_short", { ns: "common", count })
    }
    case "too_big": {
      if (issue.origin !== "string") return
      const count = Number(issue.maximum)
      if (issue.exact) return i18next.t("validation.exact_length", { ns: "common", count })
      return i18next.t("validation.too_long", { ns: "common", count })
    }
    case "invalid_format": {
      if (issue.format === "email") return i18next.t("validation.invalid_email", { ns: "common" })
      if (issue.format === "url") return i18next.t("validation.invalid_url", { ns: "common" })
      return
    }
  }
}

// Keeps zod's built-in validation messages (e.g. `.email()`, `.min()`) in the app language
export const applyZodLocale = (language: string) => {
  z.config({ ...(zodLocales[language] ?? en)(), customError: formMessages })
}
