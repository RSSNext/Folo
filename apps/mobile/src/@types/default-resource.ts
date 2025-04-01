import common_ardz from "@locales/common/ar-DZ.json"
import common_ariq from "@locales/common/ar-IQ.json"
import common_arkw from "@locales/common/ar-KW.json"
import common_arma from "@locales/common/ar-MA.json"
import common_arsa from "@locales/common/ar-SA.json"
import common_artn from "@locales/common/ar-TN.json"
import common_de from "@locales/common/de.json"
import common_en from "@locales/common/en.json"
import common_es from "@locales/common/es.json"
import common_fi from "@locales/common/fi.json"
import common_fr from "@locales/common/fr.json"
import common_it from "@locales/common/it.json"
import common_ja from "@locales/common/ja.json"
import common_ko from "@locales/common/ko.json"
import common_pt from "@locales/common/pt.json"
import common_ru from "@locales/common/ru.json"
import common_tr from "@locales/common/tr.json"
import common_zhCN from "@locales/common/zh-CN.json"
import common_zhHK from "@locales/common/zh-HK.json"
import common_zhTW from "@locales/common/zh-TW.json"
import errors_de from "@locales/errors/de.json"
import errors_en from "@locales/errors/en.json"
import errors_fr from "@locales/errors/fr.json"
import errors_ja from "@locales/errors/ja.json"
import errors_ko from "@locales/errors/ko.json"
import errors_ru from "@locales/errors/ru.json"
import errors_tr from "@locales/errors/tr.json"
import errors_zhCN from "@locales/errors/zh-CN.json"
import errors_zhHK from "@locales/errors/zh-HK.json"
import errors_zhTW from "@locales/errors/zh-TW.json"
import lang_ardz from "@locales/lang/ar-DZ.json"
import lang_ariq from "@locales/lang/ar-IQ.json"
import lang_arkw from "@locales/lang/ar-KW.json"
import lang_arma from "@locales/lang/ar-MA.json"
import lang_arsa from "@locales/lang/ar-SA.json"
import lang_artn from "@locales/lang/ar-TN.json"
import lang_de from "@locales/lang/de.json"
import lang_en from "@locales/lang/en.json"
import lang_es from "@locales/lang/es.json"
import lang_fi from "@locales/lang/fi.json"
import lang_fr from "@locales/lang/fr.json"
import lang_it from "@locales/lang/it.json"
import lang_ja from "@locales/lang/ja.json"
import lang_ko from "@locales/lang/ko.json"
import lang_pt from "@locales/lang/pt.json"
import lang_ru from "@locales/lang/ru.json"
import lang_tr from "@locales/lang/tr.json"
import lang_zhCN from "@locales/lang/zh-CN.json"
import lang_zhHK from "@locales/lang/zh-HK.json"
import lang_zhTW from "@locales/lang/zh-TW.json"
import arDZ from "@locales/mobile/default/ar-DZ.json"
import arIQ from "@locales/mobile/default/ar-IQ.json"
import arKW from "@locales/mobile/default/ar-KW.json"
import arMA from "@locales/mobile/default/ar-MA.json"
import arSA from "@locales/mobile/default/ar-SA.json"
import arTN from "@locales/mobile/default/ar-TN.json"
import de from "@locales/mobile/default/de.json"
import en from "@locales/mobile/default/en.json"
import es from "@locales/mobile/default/es.json"
import fi from "@locales/mobile/default/fi.json"
import fr from "@locales/mobile/default/fr.json"
import it from "@locales/mobile/default/it.json"
import ja from "@locales/mobile/default/ja.json"
import ko from "@locales/mobile/default/ko.json"
import pt from "@locales/mobile/default/pt.json"
import ru from "@locales/mobile/default/ru.json"
import tr from "@locales/mobile/default/tr.json"
import zhCN from "@locales/mobile/default/zh-CN.json"
import zhHK from "@locales/mobile/default/zh-HK.json"
import zhTW from "@locales/mobile/default/zh-TW.json"

import type { MobileSupportedLanguages, ns } from "./constants"

// @keep-sorted
export const defaultResources = {
  // @keep-sorted
  "ar-DZ": {
    common: common_ardz,
    default: arDZ,
    lang: lang_ardz,
  },
  // @keep-sorted
  "ar-IQ": {
    common: common_ariq,
    default: arIQ,
    lang: lang_ariq,
  },
  // @keep-sorted
  "ar-KW": {
    common: common_arkw,
    default: arKW,
    lang: lang_arkw,
  },
  // @keep-sorted
  "ar-MA": {
    common: common_arma,
    default: arMA,
    lang: lang_arma,
  },
  // @keep-sorted
  "ar-SA": {
    common: common_arsa,
    default: arSA,
    lang: lang_arsa,
  },
  // @keep-sorted
  "ar-TN": {
    common: common_artn,
    default: arTN,
    lang: lang_artn,
  },
  // @keep-sorted
  "zh-CN": {
    common: common_zhCN,
    default: zhCN,
    errors: errors_zhCN,
    lang: lang_zhCN,
  },
  // @keep-sorted
  "zh-HK": {
    common: common_zhHK,
    default: zhHK,
    errors: errors_zhHK,
    lang: lang_zhHK,
  },
  // @keep-sorted
  "zh-TW": {
    common: common_zhTW,
    default: zhTW,
    errors: errors_zhTW,
    lang: lang_zhTW,
  },
  // @keep-sorted
  de: {
    common: common_de,
    default: de,
    errors: errors_de,
    lang: lang_de,
  },
  // @keep-sorted
  en: {
    common: common_en,
    default: en,
    errors: errors_en,
    lang: lang_en,
  },
  // @keep-sorted
  es: {
    common: common_es,
    default: es,
    lang: lang_es,
  },
  // @keep-sorted
  fi: {
    common: common_fi,
    default: fi,
    lang: lang_fi,
  },
  // @keep-sorted
  fr: {
    common: common_fr,
    default: fr,
    errors: errors_fr,
    lang: lang_fr,
  },
  // @keep-sorted
  it: {
    common: common_it,
    default: it,
    lang: lang_it,
  },
  // @keep-sorted
  ja: {
    common: common_ja,
    default: ja,
    errors: errors_ja,
    lang: lang_ja,
  },
  // @keep-sorted
  ko: {
    common: common_ko,
    default: ko,
    errors: errors_ko,
    lang: lang_ko,
  },
  // @keep-sorted
  pt: {
    common: common_pt,
    default: pt,
    lang: lang_pt,
  },
  // @keep-sorted
  ru: {
    common: common_ru,
    default: ru,
    errors: errors_ru,
    lang: lang_ru,
  },
  // @keep-sorted
  tr: {
    common: common_tr,
    default: tr,
    errors: errors_tr,
    lang: lang_tr,
  },
} satisfies Record<
  MobileSupportedLanguages,
  Partial<Record<(typeof ns)[number], Record<string, string>>>
>
