// Uploads the App Store creative assets that render.ts writes to
// output/app-store/creative and assigns the approved ones to the live iOS
// version as product page header and search results asset, per localization.
//   tsx store-assets/scripts/app-store-creative.ts upload
//   tsx store-assets/scripts/app-store-creative.ts assign [--dry-run]
// Review submission only exists in App Store Connect: Asset Library → Edit →
// select the uploads → Add for Review → Submit for Review. Once approved, an
// asset can be swapped on the live version without a new app version.
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { copyFile, mkdtemp, readdir, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"

import { join } from "pathe"

const APP = "6739802604"
const creativeDir = join(import.meta.dirname, "..", "output", "app-store", "creative")
const placementTypes = ["PRODUCT_PAGE_HEADER_ASSET", "APP_STORE_SEARCH_RESULTS_ASSET"]
const dryRun = process.argv.includes("--dry-run")

interface Resource<T> {
  id: string
  attributes: T
  relationships?: Record<string, { data?: { id: string } | null }>
}

const asc = <T>(args: string[]): T =>
  JSON.parse(
    execFileSync("asc", [...args, "--output", "json"], {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      // asc prints paging hints on stderr; failures still throw with it.
      stdio: ["ignore", "pipe", "pipe"],
    }),
  ) as T

const uploadName = (locale: string) => `folo-universal-${locale}.png`

// Store locales whose render is identical to an earlier one share its upload
// (es-MX uses the es-ES image), so App Review sees each image once.
const renders = async () => {
  const firstByHash = new Map<string, string>()
  const result: { locale: string; path: string; name: string; shared: boolean }[] = []
  for (const locale of (await readdir(creativeDir)).sort()) {
    const path = join(creativeDir, locale, "universal.png")
    const hash = createHash("sha256")
      .update(await readFile(path))
      .digest("hex")
    const first = firstByHash.get(hash) ?? locale
    firstByHash.set(hash, first)
    result.push({ locale, path, name: uploadName(first), shared: first !== locale })
  }
  return result
}

type ImageAttributes = { fileName: string; state: string; category: string; createdDate: string }

// The newest non-archived creative asset per file name.
const libraryImages = () => {
  const { data } = asc<{ data: Resource<ImageAttributes>[] }>([
    "asset-library",
    "images",
    "list",
    "--library-id",
    APP,
    "--paginate",
  ])
  const byName = new Map<string, Resource<ImageAttributes>>()
  for (const image of data) {
    const { category, state, fileName, createdDate } = image.attributes
    if (category !== "CREATIVE_ASSETS" || state === "ARCHIVED") continue
    const current = byName.get(fileName)
    if (!current || current.attributes.createdDate < createdDate) byName.set(fileName, image)
  }
  return byName
}

const upload = async () => {
  const existing = libraryImages()
  const work = await mkdtemp(join(tmpdir(), "folo-creative-"))
  try {
    for (const render of await renders()) {
      if (render.shared) {
        console.log(`${render.locale}: uses ${render.name}`)
        continue
      }
      const current = existing.get(render.name)
      if (current) {
        console.log(
          `${render.locale}: ${render.name} already uploaded (${current.attributes.state})`,
        )
        continue
      }
      // The library names an upload after its file.
      const file = join(work, render.name)
      await copyFile(render.path, file)
      const result = asc<{ imageId: string; state: string }>([
        "asset-library",
        "images",
        "upload",
        "--library-id",
        APP,
        "--file",
        file,
      ])
      console.log(`${render.locale}: uploaded ${result.imageId} (${result.state})`)
    }
  } finally {
    await rm(work, { recursive: true, force: true })
  }
}

type VersionAttributes = { versionString: string; appVersionState?: string; appStoreState?: string }

const assign = async () => {
  const { data: versions } = asc<{ data: Resource<VersionAttributes>[] }>([
    "versions",
    "list",
    "--app",
    APP,
    "--platform",
    "IOS",
    "--limit",
    "5",
  ])
  const live = versions.find(
    (v) =>
      (v.attributes.appVersionState ?? v.attributes.appStoreState) === "READY_FOR_DISTRIBUTION",
  )
  if (!live) throw new Error("No live iOS version")
  console.log(`iOS ${live.attributes.versionString} (${live.id})${dryRun ? ", dry run" : ""}`)

  const nameByLocale = new Map((await renders()).map((r) => [r.locale, r.name]))
  const images = libraryImages()
  const { data: localizations } = asc<{ data: Resource<{ locale: string }>[] }>([
    "localizations",
    "list",
    "--version",
    live.id,
  ])
  for (const localization of localizations) {
    const { locale } = localization.attributes
    const name = nameByLocale.get(locale)
    const image = name && images.get(name)
    if (!image) {
      console.log(`${locale}: no creative asset`)
      continue
    }
    if (image.attributes.state !== "APPROVED") {
      console.log(`${locale}: ${name} is ${image.attributes.state}`)
      continue
    }
    const { data: placements } = asc<{ data: Resource<{ placementType: string }>[] }>([
      "localizations",
      "placements",
      "list",
      "--localization-id",
      localization.id,
      "--placement-type",
      placementTypes.join(","),
      // Without it the placements carry no image relationship to compare.
      "--include",
      "image",
    ])
    for (const type of placementTypes) {
      const current = placements.filter((p) => p.attributes.placementType === type)
      if (current.some((p) => p.relationships?.image?.data?.id === image.id)) {
        console.log(`${locale}: ${type} already uses ${name}`)
        continue
      }
      console.log(`${locale}: ${type} → ${name}${current.length > 0 ? " (replacing)" : ""}`)
      if (dryRun) continue
      // A slot holds one asset, so the old placement goes first.
      for (const old of current) {
        asc(["localizations", "placements", "delete", "--id", old.id, "--confirm"])
      }
      asc([
        "localizations",
        "placements",
        "create",
        "--localization-id",
        localization.id,
        "--image-id",
        image.id,
        "--placement-type",
        type,
      ])
    }
  }
}

const command = process.argv[2]
if (command === "upload") await upload()
else if (command === "assign") await assign()
else throw new Error("Usage: app-store-creative.ts upload | assign [--dry-run]")
