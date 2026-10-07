// Creates or updates the App Store custom product pages in src/custom-pages.ts:
// one localization per App Store locale with its promotional text, keywords and
// the iPhone and iPad screenshots render.ts wrote, in the page's order.
//   tsx store-assets/scripts/app-store-custom-pages.ts sync [--page ai,...] [--skip-screenshots]
//   tsx store-assets/scripts/app-store-custom-pages.ts submit
// sync only changes editable page versions (Prepare for Submission) and makes a
// new version of an approved page; submit sends every editable version to App Review.
import { execFileSync } from "node:child_process"
import { copyFile, mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "pathe"

import { customPages } from "../src/custom-pages"
import { loadListing } from "../src/listing"
import { listingLocales } from "../src/locales"

const APP = "6739802604"
const outputDir = join(import.meta.dirname, "..", "output", "app-store")
const devices = [
  { dir: "iphone", type: "IPHONE_67" },
  { dir: "ipad", type: "IPAD_PRO_3GEN_129" },
]
const editable = "PREPARE_FOR_SUBMISSION"
const inReview = new Set(["READY_FOR_REVIEW", "WAITING_FOR_REVIEW", "IN_REVIEW"])

const arg = (name: string) => {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? null : process.argv[index + 1]!.split(",")
}
const pageFilter = arg("page")
const skipScreenshots = process.argv.includes("--skip-screenshots")

interface Resource<T> {
  id: string
  attributes: T
}

const asc = <T = unknown>(args: string[]): T =>
  JSON.parse(
    execFileSync("asc", [...args, "--output", "json"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      // asc prints paging hints on stderr; failures still throw with it.
      stdio: ["ignore", "pipe", "pipe"],
    }),
  ) as T

const cp = (...args: string[]) => ["product-pages", "custom-pages", ...args]

const findPage = (name: string) =>
  asc<{ data: Resource<{ name: string }>[] }>(cp("list", "--app", APP, "--paginate")).data.find(
    (p) => p.attributes.name === name,
  )

const versionsOf = (pageId: string) =>
  asc<{ data: Resource<{ version: string; state: string }>[] }>(
    cp("versions", "list", "--custom-page-id", pageId),
  ).data

// The page version sync may edit: the editable one, or a new one when the
// current version is approved. A version under review is left alone.
const editableVersion = (name: string) => {
  const page = findPage(name)
  if (!page) {
    const created = asc<{ data: { id: string } }>(cp("create", "--app", APP, "--name", name))
    console.log(`${name}: created page ${created.data.id}`)
    return versionsOf(created.data.id)[0]!.id
  }
  const versions = versionsOf(page.id)
  const draft = versions.find((v) => v.attributes.state === editable)
  if (draft) return draft.id
  const pending = versions.find((v) => inReview.has(v.attributes.state))
  if (pending) {
    console.log(`${name}: version ${pending.attributes.version} is ${pending.attributes.state}`)
    return null
  }
  const created = asc<{ data: { id: string } }>(
    cp("versions", "create", "--custom-page-id", page.id),
  )
  console.log(`${name}: created version ${created.data.id}`)
  return created.data.id
}

const sync = async () => {
  const work = await mkdtemp(join(tmpdir(), "folo-custom-pages-"))
  try {
    for (const spec of customPages) {
      if (pageFilter && !pageFilter.includes(spec.id)) continue
      const versionId = editableVersion(spec.name)
      if (!versionId) continue
      const localizations = new Map(
        asc<{ data: Resource<{ locale: string }>[] }>(
          cp("localizations", "list", "--custom-page-version-id", versionId),
        ).data.map((l) => [l.attributes.locale, l.id]),
      )
      for (const locale of listingLocales) {
        const copy = (await loadListing(locale.id)).appStore.customPages[spec.id]!
        for (const storeLocale of locale.appStore) {
          let localizationId = localizations.get(storeLocale)
          if (localizationId) {
            asc(
              cp(
                "localizations",
                "update",
                "--localization-id",
                localizationId,
                "--promotional-text",
                copy.promotionalText,
              ),
            )
          } else {
            localizationId = asc<{ data: { id: string } }>(
              cp(
                "localizations",
                "create",
                "--custom-page-version-id",
                versionId,
                "--locale",
                storeLocale,
                "--promotional-text",
                copy.promotionalText,
              ),
            ).data.id
          }

          const keywords = cp("localizations", "search-keywords")
          const current = new Set(
            asc<{ data: { id: string }[] }>([
              ...keywords,
              "list",
              "--localization-id",
              localizationId,
            ]).data.map((k) => k.id),
          )
          const missing = copy.keywords.filter((k) => !current.has(k))
          const extra = [...current].filter((k) => !copy.keywords.includes(k))
          if (missing.length > 0) {
            asc([
              ...keywords,
              "add",
              "--localization-id",
              localizationId,
              "--keywords",
              missing.join(","),
            ])
          }
          if (extra.length > 0) {
            asc([
              ...keywords,
              "delete",
              "--localization-id",
              localizationId,
              "--keywords",
              extra.join(","),
              "--confirm",
            ])
          }

          if (!skipScreenshots) {
            for (const device of devices) {
              // Uploads keep the file order, so the files are renamed to it.
              const dir = join(work, spec.id, storeLocale, device.dir)
              await mkdir(dir, { recursive: true })
              for (const [index, slide] of spec.slides.entries()) {
                await copyFile(
                  join(outputDir, device.dir, storeLocale, `${slide}.png`),
                  join(dir, `${String(index + 1).padStart(2, "0")}.png`),
                )
              }
              asc(
                cp(
                  "localizations",
                  "screenshot-sets",
                  "sync",
                  "--localization-id",
                  localizationId,
                  "--path",
                  dir,
                  "--device-type",
                  device.type,
                  "--confirm",
                ),
              )
            }
          }
          console.log(
            `${spec.name} ${storeLocale}: text, ${copy.keywords.length} keywords${skipScreenshots ? "" : ", screenshots"}`,
          )
        }
      }
    }
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

const submit = () => {
  const drafts: { name: string; versionId: string }[] = []
  for (const spec of customPages) {
    const page = findPage(spec.name)
    const draft = page && versionsOf(page.id).find((v) => v.attributes.state === editable)
    if (draft) drafts.push({ name: spec.name, versionId: draft.id })
  }
  if (drafts.length === 0) {
    console.log("No custom product page version to submit")
    return
  }
  const submission = asc<{ data: { id: string } }>([
    "review",
    "submissions-create",
    "--app",
    APP,
    "--platform",
    "IOS",
  ]).data.id
  for (const draft of drafts) {
    asc([
      "review",
      "items",
      "add",
      "--submission",
      submission,
      "--item-type",
      "appCustomProductPageVersions",
      "--item-id",
      draft.versionId,
    ])
    console.log(`${draft.name}: added to submission ${submission}`)
  }
  asc(["review", "submissions-submit", "--id", submission, "--confirm"])
  console.log(`Submitted ${drafts.length} custom product pages for review`)
}

const command = process.argv[2]
if (command === "sync") await sync()
else if (command === "submit") submit()
else
  throw new Error(
    "Usage: app-store-custom-pages.ts sync [--page ai,...] [--skip-screenshots] | submit",
  )
