import { copyFileSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { dirname, join } from "pathe"

// @ts-ignore
const __dirname = dirname(fileURLToPath(import.meta.url))
const changelogDir = join(__dirname, "..", "changelog")

const nextFile = join(changelogDir, "next.md")

const new_version = process.argv[2]

const majorMinorPatch = new_version!.split("-")[0]

const nextContent = readFileSync(nextFile, "utf-8")
writeFileSync(nextFile, nextContent.replaceAll("NEXT_VERSION", majorMinorPatch!))

// Rename the next.md to the new version
renameSync(nextFile, join(changelogDir, `${majorMinorPatch}.md`))
// Replace the NEXT_VERSION in the next.md file with the new version

// Create the new next.md file

copyFileSync(join(changelogDir, "next.template.md"), join(changelogDir, "next.md"))
