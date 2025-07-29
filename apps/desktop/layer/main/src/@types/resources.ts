import en from "@locales/native/en.json"
import ja from "@locales/native/ja.json"
import zhCn from "@locales/native/zh-CN.json"
import zhTw from "@locales/native/zh-TW.json"

import type { MainSupportedLanguages, ns } from "./constants"

export const resources = {
  en: {
    native: en,
  },
  "zh-CN": {
    native: zhCn,
  },

  "zh-TW": {
    native: zhTw,
  },
  ja: {
    native: ja,
  },
} satisfies Record<MainSupportedLanguages, Record<(typeof ns)[number], Record<string, string>>>
