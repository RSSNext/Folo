import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { describe, expect, it } from "vitest"

import { currentSupportedLanguages } from "./constants"
import { resources } from "./resources"

const nativeLocalesDir = fileURLToPath(new URL("../../../../../../locales/native", import.meta.url))

describe("main process resources", () => {
  it("bundles every native locale file", () => {
    const languages = readdirSync(nativeLocalesDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.slice(0, -".json".length))
      .sort()

    // A language missing here makes the app menu, context menus and tray fall back to English.
    expect(Object.keys(resources).sort()).toEqual(languages)
    expect([...currentSupportedLanguages].sort()).toEqual(languages)
  })
})
