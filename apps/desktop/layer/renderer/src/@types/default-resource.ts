// DONT EDIT THIS FILE MANUALLY
import ai_en from "@locales/ai/en.json"
import en from "@locales/app/en.json"
import common_en from "@locales/common/en.json"
import common_ja from "@locales/common/ja.json"
import common_zhCN from "@locales/common/zh-CN.json"
import common_zhTW from "@locales/common/zh-TW.json"
import errors_en from "@locales/errors/en.json"
import lang_en from "@locales/lang/en.json"
import lang_ja from "@locales/lang/ja.json"
import lang_zhCN from "@locales/lang/zh-CN.json"
import lang_zhTW from "@locales/lang/zh-TW.json"
import settings_en from "@locales/settings/en.json"
import shortcuts_en from "@locales/shortcuts/en.json"

import type { ns, RendererSupportedLanguages } from "./constants"

/**
 * This file is the language resource that is loaded in full when the app is initialized.
 * When switching languages, the app will automatically download the required language resources,
 * we will not load all the language resources to minimize the first screen loading time of the app.
 * Generally, we only load english resources synchronously by default.
 * In addition, we attach common resources for other languages, and the size of the common resources must be controlled.
 */
export const defaultResources = {
  en: {
    app: en,
    lang: lang_en,
    common: common_en,
    settings: settings_en,
    shortcuts: shortcuts_en,
    errors: errors_en,
    ai: ai_en,
  },
  "zh-CN": {
    lang: lang_zhCN,
    common: common_zhCN,
  },

  ja: {
    lang: lang_ja,
    common: common_ja,
  },
  "zh-TW": { lang: lang_zhTW, common: common_zhTW },
} satisfies Record<
  RendererSupportedLanguages,
  Partial<Record<(typeof ns)[number], Record<string, string>>>
>
