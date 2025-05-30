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
import en from "@locales/mobile/default/en.json"
import ja from "@locales/mobile/default/ja.json"
import zhCN from "@locales/mobile/default/zh-CN.json"
import zhTW from "@locales/mobile/default/zh-TW.json"
import settings_en from "@locales/settings/en.json"
import settings_ja from "@locales/settings/ja.json"
import settings_zhCN from "@locales/settings/zh-CN.json"
import settings_zhTW from "@locales/settings/zh-TW.json"

import type { MobileSupportedLanguages, ns } from "./constants"

// @keep-sorted
export const defaultResources = {
  // @keep-sorted
  "zh-CN": {
    common: common_zhCN,
    default: zhCN,
    errors: errors_zhCN,
    lang: lang_zhCN,
    settings: settings_zhCN,
  },
  // @keep-sorted
  "zh-TW": {
    common: common_zhTW,
    default: zhTW,
    errors: errors_zhTW,
    lang: lang_zhTW,
    settings: settings_zhTW,
  },
  // @keep-sorted
  en: {
    common: common_en,
    default: en,
    errors: errors_en,
    lang: lang_en,
    settings: settings_en,
  },
  // @keep-sorted
  ja: {
    common: common_ja,
    default: ja,
    errors: errors_ja,
    lang: lang_ja,
    settings: settings_ja,
  },
} satisfies Record<
  MobileSupportedLanguages,
  Partial<Record<(typeof ns)[number], Record<string, string>>>
>
