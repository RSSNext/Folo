import { readFile } from "node:fs/promises"

import { join } from "pathe"

import type { AppUiLocale } from "./locales"

// UI labels read from the app's own locale files, so automation can find
// buttons by accessibility label in every UI language.
const localesDir = join(import.meta.dirname, "..", "..", "locales")

const fileLocale: Record<AppUiLocale, string> = {
  en: "en",
  "zh-Hans": "zh-CN",
  "zh-Hant": "zh-TW",
  ja: "ja",
  fr: "fr-FR",
}

const load = async (namespace: string, locale: AppUiLocale) =>
  JSON.parse(
    await readFile(join(localesDir, namespace, `${fileLocale[locale]}.json`), "utf8"),
  ) as Record<string, string>

export const loadLabels = async (locale: AppUiLocale) => {
  const [mobile, common, app, settings] = await Promise.all([
    load("mobile/default", locale),
    load("common", locale),
    load("app", locale),
    load("settings", locale),
  ])
  const pick = (source: Record<string, string>, key: string) => {
    const value = source[key]
    if (!value) throw new Error(`Missing ${key} for ${locale}`)
    return value
  }
  return {
    home: pick(mobile, "tabs.home"),
    subscriptions: pick(mobile, "tabs.subscriptions"),
    discover: pick(mobile, "tabs.discover"),
    settings: pick(mobile, "tabs.settings"),
    articles: pick(common, "feed_view_type.articles"),
    socialMedia: pick(common, "feed_view_type.social_media"),
    pictures: pick(common, "feed_view_type.pictures"),
    videos: pick(common, "feed_view_type.videos"),
    audios: pick(common, "feed_view_type.audios"),
    categories: pick(common, "words.categories"),
    playTts: pick(app, "entry_content.header.play_tts"),
    aiTranslation: pick(settings, "general.action.translation.label"),
    // Builds up to 0.5.10 show the entry menu item in English; later builds
    // localize it. Match either.
    showTranslation: [pick(mobile, "entry_content.header.show_translation"), "Show Translation"],
    stopPlayback: pick(mobile, "player.stop"),
    // Title of the AI summary card on the mobile entry screen.
    aiSummary: pick(mobile, "entry_content.ai_summary"),
    // The entry screen's "more" button; English in builds up to 0.5.10.
    moreActions: [pick(mobile, "entry_content.header.more_actions"), "More Actions"],
  }
}

export type Labels = Awaited<ReturnType<typeof loadLabels>>

// Names the language pickers show for each UI locale.
export const languageNames: Record<AppUiLocale, string[]> = {
  en: ["English"],
  "zh-Hans": ["简体中文", "中文（简体）", "Chinese (Simplified)"],
  "zh-Hant": ["繁體中文", "中文（繁體）", "Chinese (Traditional)"],
  ja: ["日本語", "Japanese"],
  fr: ["Français (France)", "Français", "French"],
}
