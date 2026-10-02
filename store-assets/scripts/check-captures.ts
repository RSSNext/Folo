// Lists the app captures each UI locale still needs for the decks:
//   tsx store-assets/scripts/check-captures.ts
import { existsSync } from "node:fs"

import { join } from "pathe"

import { decks } from "../src/decks"
import { appUiLocales } from "../src/locales"

const root = join(import.meta.dirname, "..")

let incomplete = 0
for (const locale of appUiLocales) {
  const missing = new Set<string>()
  for (const deck of decks) {
    for (const slide of deck.slides) {
      const shots: [string, string][] = [
        ...slide.shots.map((shot): [string, string] => [deck.captureDevice, shot]),
        ...(slide.companion
          ? [[slide.companion.device, slide.companion.shot] as [string, string]]
          : []),
        ...(slide.callouts ?? []).map((c): [string, string] => [deck.captureDevice, c.shot]),
      ]
      for (const [device, shot] of shots) {
        if (!existsSync(join(root, "captures", locale, device, `${shot}.png`))) {
          missing.add(`${device}/${shot}`)
        }
      }
    }
  }
  // The Google Play feature graphic shows the Android timeline.
  if (!existsSync(join(root, "captures", locale, "android", "timeline.png"))) {
    missing.add("android/timeline")
  }
  if (missing.size > 0) incomplete++
  console.log(`${locale}: ${[...missing].sort().join(", ") || "complete"}`)
}
process.exitCode = incomplete > 0 ? 1 : 0
