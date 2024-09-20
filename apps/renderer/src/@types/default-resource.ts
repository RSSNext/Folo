import en from "../../../../locales/app/en.json"
import common_ardz from "../../../../locales/common/ar-DZ.json"
import common_ariq from "../../../../locales/common/ar-IQ.json"
import common_arkw from "../../../../locales/common/ar-KW.json"
import common_arma from "../../../../locales/common/ar-MA.json"
import common_arsa from "../../../../locales/common/ar-SA.json"
import common_artn from "../../../../locales/common/ar-TN.json"
import common_de from "../../../../locales/common/de.json"
import common_en from "../../../../locales/common/en.json"
import common_es from "../../../../locales/common/es.json"
import common_fi from "../../../../locales/common/fi.json"
import common_fr from "../../../../locales/common/fr.json"
import common_it from "../../../../locales/common/it.json"
import common_ja from "../../../../locales/common/ja.json"
import common_pt from "../../../../locales/common/pt.json"
import common_ru from "../../../../locales/common/ru.json"
import common_zhCN from "../../../../locales/common/zh-CN.json"
import common_zhTW from "../../../../locales/common/zh-TW.json"
import errors_en from "../../../../locales/errors/en.json"
import external_en from "../../../../locales/external/en.json"
import lang_ardz from "../../../../locales/lang/ar-DZ.json"
import lang_ariq from "../../../../locales/lang/ar-IQ.json"
import lang_arkw from "../../../../locales/lang/ar-KW.json"
import lang_arma from "../../../../locales/lang/ar-MA.json"
import lang_arsa from "../../../../locales/lang/ar-SA.json"
import lang_artn from "../../../../locales/lang/ar-TN.json"
import lang_de from "../../../../locales/lang/de.json"
import lang_en from "../../../../locales/lang/en.json"
import lang_es from "../../../../locales/lang/es.json"
import lang_fi from "../../../../locales/lang/fi.json"
import lang_fr from "../../../../locales/lang/fr.json"
import lang_it from "../../../../locales/lang/it.json"
import lang_ja from "../../../../locales/lang/ja.json"
import lang_pt from "../../../../locales/lang/pt.json"
import lang_ru from "../../../../locales/lang/ru.json"
import lang_zhCN from "../../../../locales/lang/zh-CN.json"
import lang_zhTW from "../../../../locales/lang/zh-TW.json"
import settings_en from "../../../../locales/settings/en.json"
import shortcuts_en from "../../../../locales/shortcuts/en.json"
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
    external: external_en,
    settings: settings_en,
    shortcuts: shortcuts_en,
    errors: errors_en,
  },
  "zh-CN": {
    lang: lang_zhCN,
    common: common_zhCN,
  },
  ja: {
    lang: lang_ja,
    common: common_ja,
  },
  ru: { lang: lang_ru, common: common_ru },
  fi: { lang: lang_fi, common: common_fi },
  it: { lang: lang_it, common: common_it },
  "ar-DZ": { lang: lang_ardz, common: common_ardz },
  "ar-SA": { lang: lang_arsa, common: common_arsa },
  "ar-MA": { lang: lang_arma, common: common_arma },
  "zh-TW": { lang: lang_zhTW, common: common_zhTW },
  es: { lang: lang_es, common: common_es },
  fr: { lang: lang_fr, common: common_fr },
  pt: { lang: lang_pt, common: common_pt },
  "ar-IQ": { lang: lang_ariq, common: common_ariq },
  "ar-KW": { lang: lang_arkw, common: common_arkw },
  "ar-TN": { lang: lang_artn, common: common_artn },
  de: { lang: lang_de, common: common_de },
}
