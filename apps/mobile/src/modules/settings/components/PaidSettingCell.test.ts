import { readdirSync, readFileSync } from "node:fs"

import { PAID_SETTINGS, SettingPaidLevels } from "@follow/shared/settings/constants"
import { describe, expect, it } from "vitest"

const routesDir = new URL("../routes/", import.meta.url)

// The setter each namespace's settings screens save with, and the hook that says the plan lacks one
const SETTING_HOOKS = {
  general: { setter: "setGeneralSetting", lockedHook: "useGeneralPaidSettingLocked" },
  ui: { setter: "setUISetting", lockedHook: "useUIPaidSettingLocked" },
} as const

// A call with the key as its first argument, however the formatter wraps it
const callsWithKey = (source: string, fn: string, key: string) =>
  new RegExp(String.raw`\b${fn}\(\s*"${key}"\s*[,)]`).test(source)

describe("PaidSettingCell", () => {
  it("locks every paid setting a settings screen changes", () => {
    const unlocked: string[] = []

    for (const file of readdirSync(routesDir).filter((name) => name.endsWith(".tsx"))) {
      const source = readFileSync(new URL(file, routesDir), "utf8")

      for (const [namespace, { setter, lockedHook }] of Object.entries(SETTING_HOOKS)) {
        const paidSettings: Record<string, SettingPaidLevels> =
          PAID_SETTINGS[namespace as keyof typeof SETTING_HOOKS]
        for (const [key, level] of Object.entries(paidSettings)) {
          // Free plans have these, so nothing locks them
          if (level === SettingPaidLevels.Free || level === SettingPaidLevels.FreeLimited) continue

          // A switch for a paid setting without its lock refuses to turn on without saying why
          if (callsWithKey(source, setter, key) && !callsWithKey(source, lockedHook, key)) {
            unlocked.push(`${file}: ${key}`)
          }
        }
      }
    }

    expect(unlocked).toEqual([])
  })
})
