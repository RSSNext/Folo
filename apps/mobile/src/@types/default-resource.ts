import common_en from "@locales/common/en.json"
import common_zhCN from "@locales/common/zh-CN.json"
import errors_en from "@locales/errors/en.json"
import errors_zhCN from "@locales/errors/zh-CN.json"
import lang_en from "@locales/lang/en.json"
import lang_zhCN from "@locales/lang/zh-CN.json"
import en from "@locales/mobile/default/en.json"
import zhCN from "@locales/mobile/default/zh-CN.json"

import type { MobileSupportedLanguages, ns } from "./constants"

// @keep-sorted
export const defaultResources = {
  "zh-CN": {
    default: zhCN,
    common: common_zhCN,
    errors: errors_zhCN,
    lang: lang_zhCN,
  },
  en: {
    default: en,
    common: common_en,
    errors: errors_en,
    lang: lang_en,
  },
} satisfies Record<MobileSupportedLanguages, Record<(typeof ns)[number], Record<string, string>>>
