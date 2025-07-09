// DONT EDIT THIS FILE MANUALLY
import en from "@locales/app/en.json"
import app_ja from "@locales/app/ja.json"
import app_zhCN from "@locales/app/zh-CN.json"
import app_zhTW from "@locales/app/zh-TW.json"
import common_en from "@locales/common/en.json"
import common_ja from "@locales/common/ja.json"
import common_zhCN from "@locales/common/zh-CN.json"
import common_zhTW from "@locales/common/zh-TW.json"
import errors_en from "@locales/errors/en.json"
import errors_ja from "@locales/errors/ja.json"
import errors_zhCN from "@locales/errors/zh-CN.json"
import errors_zhTW from "@locales/errors/zh-TW.json"
import lang_en from "@locales/lang/en.json"
import lang_ja from "@locales/lang/ja.json"
import lang_zhCN from "@locales/lang/zh-CN.json"
import lang_zhTW from "@locales/lang/zh-TW.json"
import settings_en from "@locales/settings/en.json"
import settings_ja from "@locales/settings/ja.json"
import settings_zhCN from "@locales/settings/zh-CN.json"
import settings_zhTW from "@locales/settings/zh-TW.json"
import shortcuts_en from "@locales/shortcuts/en.json"
import shortcuts_ja from "@locales/shortcuts/ja.json"
import shortcuts_zhCN from "@locales/shortcuts/zh-CN.json"
import shortcuts_zhTW from "@locales/shortcuts/zh-TW.json"

import type { ns, RendererSupportedLanguages } from "./constants"

/**
 * This file is the language resource that is loaded in full when the app is initialized.
 * In electron, we can load all the language resources synchronously.
 */
export const defaultResources = {
  en: {
    app: en,
    lang: lang_en,
    common: common_en,
    settings: settings_en,
    shortcuts: shortcuts_en,
    errors: errors_en,
  },
  "zh-CN": {
    app: app_zhCN,
    lang: lang_zhCN,
    common: common_zhCN,
    settings: settings_zhCN,
    shortcuts: shortcuts_zhCN,
    errors: errors_zhCN,
  },

  ja: {
    app: app_ja,
    lang: lang_ja,
    common: common_ja,
    settings: settings_ja,
    shortcuts: shortcuts_ja,
    errors: errors_ja,
  },
  "zh-TW": {
    app: app_zhTW,
    lang: lang_zhTW,
    common: common_zhTW,
    settings: settings_zhTW,
    shortcuts: shortcuts_zhTW,
    errors: errors_zhTW,
  },
} satisfies Record<
  RendererSupportedLanguages,
  Partial<Record<(typeof ns)[number], Record<string, string>>>
>
