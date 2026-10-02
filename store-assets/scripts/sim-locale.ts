// Sets an iOS simulator's system language to match a UI locale, reboots it,
// restores the clean status bar and relaunches Folo:
//   tsx store-assets/scripts/sim-locale.ts <locale> <udid> [udid...]
import { execFile } from "node:child_process"
import { promisify } from "node:util"

import { sleep } from "../src/desktop"
import type { AppUiLocale } from "../src/locales"
import { appUiLocales } from "../src/locales"

const run = promisify(execFile)

const systemLocale: Record<AppUiLocale, { language: string; locale: string }> = {
  en: { language: "en", locale: "en_US" },
  "zh-Hans": { language: "zh-Hans", locale: "zh_CN" },
  "zh-Hant": { language: "zh-Hant", locale: "zh_TW" },
  ja: { language: "ja", locale: "ja_JP" },
  fr: { language: "fr", locale: "fr_FR" },
}

const [locale, ...udids] = process.argv.slice(2) as [AppUiLocale, ...string[]]
if (!appUiLocales.includes(locale) || udids.length === 0) {
  throw new Error("Usage: sim-locale.ts <locale> <udid> [udid...]")
}
const { language, locale: region } = systemLocale[locale]

const simctl = (...args: string[]) => run("xcrun", ["simctl", ...args])

for (const udid of udids) {
  await simctl("spawn", udid, "defaults", "write", "-g", "AppleLanguages", "-array", language)
  await simctl("spawn", udid, "defaults", "write", "-g", "AppleLocale", "-string", region)
  // 12-hour time keeps the status bar clock at Apple's "9:41" (no leading zero).
  await simctl("spawn", udid, "defaults", "write", "-g", "AppleICUForce12HourTime", "-bool", "true")
  await simctl("shutdown", udid).catch(() => undefined)
  await simctl("boot", udid)
  await simctl("bootstatus", udid, "-b")
  await simctl(
    "status_bar",
    udid,
    "override",
    "--time",
    "9:41",
    "--dataNetwork",
    "wifi",
    "--wifiMode",
    "active",
    "--wifiBars",
    "3",
    "--cellularMode",
    "active",
    "--cellularBars",
    "4",
    "--batteryState",
    "discharging",
    "--batteryLevel",
    "100",
  )
  await simctl("launch", udid, "is.follow")
  console.log(`${udid}: ${language} (${region})`)
}
await sleep(12_000)
