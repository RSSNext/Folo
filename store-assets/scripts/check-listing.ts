// Validates every locale's listing copy against store limits and the policy
// rules that commonly get submissions rejected. Exits non-zero on errors.
import { length, limits, loadListing } from "../src/listing"
import { listingLocales } from "../src/locales"

const errors: string[] = []
const warnings: string[] = []

const check = (locale: string, field: string, value: string, max: number) => {
  const n = length(value)
  if (n === 0) errors.push(`${locale} ${field}: empty`)
  if (n > max) errors.push(`${locale} ${field}: ${n}/${max}`)
  return n
}

// Competitor names in metadata break App Store guideline 2.3.7 and Play's metadata policy.
const competitors = /\b(?:feedly|inoreader|reeder|netnewswire|newsblur|feedbin|readwise reader)\b/i
// Play forbids promotional or performance claims in the title and short description.
const playClaims = /\b(?:best|#1|top|free|new|sale|download|install)\b/i
const url = /https?:\/\//i

const reference = await loadListing("en")
const slideKeys = Object.keys(reference.screenshots)
// Optional positional args limit the run to some locales, e.g. `check-listing.ts en ja`.
const only = process.argv.slice(2)
const locales = listingLocales.filter(({ id }) => only.length === 0 || only.includes(id))

for (const { id } of locales) {
  const listing = await loadListing(id).catch((error: Error) => {
    errors.push(`${id}: ${error.message}`)
    return null
  })
  if (!listing) continue
  const { appStore, googlePlay, microsoftStore } = listing
  const a = limits.appStore
  check(id, "appStore.name", appStore.name, a.name)
  check(id, "appStore.subtitle", appStore.subtitle, a.subtitle)
  check(id, "appStore.promotionalText", appStore.promotionalText, a.promotionalText)
  check(id, "appStore.descriptionIos", appStore.descriptionIos, a.description)
  check(id, "appStore.descriptionMacos", appStore.descriptionMacos, a.description)
  for (const platform of ["ios", "macos"] as const) {
    const keywords = appStore.keywords[platform]
    check(id, `appStore.keywords.${platform}`, keywords, a.keywords)
    if (/,\s/.test(keywords))
      errors.push(`${id} appStore.keywords.${platform}: space after comma wastes characters`)
    const titleWords = new Set(
      `${appStore.name} ${appStore.subtitle}`
        .toLowerCase()
        .split(/[\s,&·:-]+/)
        .filter(Boolean),
    )
    const repeated = keywords
      .toLowerCase()
      .split(",")
      .filter((k) => titleWords.has(k.trim()))
    if (repeated.length > 0)
      warnings.push(
        `${id} appStore.keywords.${platform}: already in name/subtitle: ${repeated.join(", ")}`,
      )
    if (competitors.test(keywords))
      errors.push(`${id} appStore.keywords.${platform}: competitor name`)
  }
  if (appStore.descriptionMacos.toLowerCase().includes("rsshub")) {
    // The Mac App Store build hides RSSHub while a version is in review.
    errors.push(`${id} appStore.descriptionMacos: mentions RSSHub`)
  }

  const g = limits.googlePlay
  check(id, "googlePlay.title", googlePlay.title, g.title)
  check(id, "googlePlay.shortDescription", googlePlay.shortDescription, g.shortDescription)
  check(id, "googlePlay.fullDescription", googlePlay.fullDescription, g.fullDescription)
  if (id === "en") {
    for (const field of ["title", "shortDescription"] as const) {
      if (playClaims.test(googlePlay[field]))
        errors.push(`${id} googlePlay.${field}: promotional claim`)
    }
  }

  const m = limits.microsoftStore
  check(id, "microsoftStore.description", microsoftStore.description, m.description)
  const short = check(
    id,
    "microsoftStore.shortDescription",
    microsoftStore.shortDescription,
    m.shortDescription,
  )
  if (short > m.shortDescriptionVisible)
    warnings.push(
      `${id} microsoftStore.shortDescription: ${short} > ${m.shortDescriptionVisible} visible`,
    )
  if (microsoftStore.features.length > m.features)
    errors.push(`${id} microsoftStore.features: ${microsoftStore.features.length}/${m.features}`)
  microsoftStore.features.forEach((f, i) =>
    check(id, `microsoftStore.features[${i}]`, f, m.feature),
  )
  microsoftStore.screenshotCaptions.forEach((c, i) =>
    check(id, `microsoftStore.screenshotCaptions[${i}]`, c, m.caption),
  )
  if (url.test(microsoftStore.description))
    errors.push(`${id} microsoftStore.description: contains a URL`)

  for (const [field, text] of [
    ["appStore.descriptionIos", appStore.descriptionIos],
    ["appStore.descriptionMacos", appStore.descriptionMacos],
    ["googlePlay.fullDescription", googlePlay.fullDescription],
    ["microsoftStore.description", microsoftStore.description],
  ] as const) {
    if (competitors.test(text)) errors.push(`${id} ${field}: competitor name`)
  }

  for (const key of slideKeys) {
    const slide = listing.screenshots[key]
    if (!slide) {
      errors.push(`${id} screenshots.${key}: missing`)
      continue
    }
    if (!slide.headline.trim()) errors.push(`${id} screenshots.${key}: empty headline`)
    const expectsPills = Boolean(reference.screenshots[key]?.pills)
    if (expectsPills && !slide.pills?.length) errors.push(`${id} screenshots.${key}: missing pills`)
  }
}

for (const w of warnings) console.warn(`warn  ${w}`)
for (const e of errors) console.error(`error ${e}`)
console.log(
  `${locales.length} locales checked, ${errors.length} errors, ${warnings.length} warnings`,
)
if (errors.length > 0) process.exitCode = 1
