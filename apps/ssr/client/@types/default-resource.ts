// DONT EDIT THIS FILE MANUALLY
import common_en from "@locales/common/en.json"
import common_ja from "@locales/common/ja.json"
import common_zhCN from "@locales/common/zh-CN.json"
import common_zhTW from "@locales/common/zh-TW.json"
import external_en from "@locales/external/en.json"
import external_zhCN from "@locales/external/zh-CN.json"

import type { ns, SSRSupportedLanguages } from "./constants"

/**
 * This file is the language resource that is loaded in full when the app is initialized.
 * When switching languages, the app will automatically download the required language resources,
 * we will not load all the language resources to minimize the first screen loading time of the app.
 * Generally, we only load english resources synchronously by default.
 * In addition, we attach common resources for other languages, and the size of the common resources must be controlled.
 */
export const defaultResources = {
  en: {
    common: common_en,
    external: external_en,
  },
  "zh-CN": {
    common: common_zhCN,
    external: external_zhCN,
  },
  ja: {
    common: common_ja,
  },
  "zh-TW": { common: common_zhTW },
} satisfies Record<
  SSRSupportedLanguages,
  Partial<Record<(typeof ns)[number], Record<string, string>>>
>
