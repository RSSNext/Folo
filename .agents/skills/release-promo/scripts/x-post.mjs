#!/usr/bin/env node
// Helpers for the release posts on X.
//   node x-post.mjs bold <version>     prints the version in math bold, e.g. 1.15.0 → 𝐯𝟏.𝟏𝟓.𝟎
//   node x-post.mjs count <file>...    prints each file's weighted length; exits 1 above 280
// The count follows twitter-text v3: code points in LIGHT weigh 1 and everything else 2
// (CJK, emoji, math bold), an emoji sequence counts as one emoji, and a link counts as 23
// whatever its length. Links are found by their domain (scheme optional, common TLDs).
import { readFileSync } from "node:fs"

const LIMIT = 280
const LINK_WEIGHT = 23
const LIGHT = [
  [0, 4351],
  [8192, 8205],
  [8208, 8223],
  [8242, 8247],
]
const link = /(?:https?:\/\/)?(?:[a-z0-9-]+\.)+(?:com|is|io|org|net|app|dev|me|co|cc)(?:\/\S*)?/giu
const emoji =
  /\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?(?:\u200D\p{Extended_Pictographic}(?:\uFE0F|\p{Emoji_Modifier})?)*|\p{Regional_Indicator}{2}|[#*0-9]\uFE0F?\u20E3/gu

export const weightedLength = (text) => {
  let total = 0
  const rest = text
    .normalize("NFC")
    .replaceAll(link, () => {
      total += LINK_WEIGHT
      return ""
    })
    .replaceAll(emoji, () => {
      total += 2
      return ""
    })
  for (const char of rest) {
    const code = char.codePointAt(0)
    total += LIGHT.some(([from, to]) => code >= from && code <= to) ? 1 : 2
  }
  return total
}

export const bold = (version) =>
  `\u{1D42F}${[...version.replace(/^v/, "")]
    .map((char) => (/\d/.test(char) ? String.fromCodePoint(0x1d7ce + Number(char)) : char))
    .join("")}`

const [command, ...rest] = process.argv.slice(2)
if (command === "bold" && rest.length === 1) {
  console.log(bold(rest[0]))
} else if (command === "count" && rest.length > 0) {
  let over = false
  for (const file of rest) {
    const length = weightedLength(readFileSync(file === "-" ? 0 : file, "utf8").trimEnd())
    over ||= length > LIMIT
    console.log(
      `${String(length).padStart(3)}/${LIMIT}  ${file}${length > LIMIT ? "  TOO LONG" : ""}`,
    )
  }
  process.exitCode = over ? 1 : 0
} else {
  console.error("Usage: x-post.mjs bold <version> | count <file|->...")
  process.exitCode = 1
}
