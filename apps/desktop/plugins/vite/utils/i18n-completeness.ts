import fs from "node:fs"
import { fileURLToPath } from "node:url"

import path, { dirname } from "pathe"

type LanguageCompletion = Record<string, number>

function getLanguageFiles(dir: string): string[] {
  return fs.readdirSync(dir).filter((file) => file.endsWith(".json"))
}

function getNamespaces(localesDir: string): string[] {
  return fs
    .readdirSync(localesDir)
    .filter((file) => fs.statSync(path.join(localesDir, file)).isDirectory())
}

function countKeys(obj: any): number {
  let count = 0
  for (const key in obj) {
    if (typeof obj[key] === "object") {
      count += countKeys(obj[key])
    } else {
      count++
    }
  }
  return count
}

function calculateCompleteness(localesDir: string): LanguageCompletion {
  const namespaces = getNamespaces(localesDir)
  const languages = new Set<string>()
  const keyCount: Record<string, number> = {}

  namespaces.forEach((namespace) => {
    const namespaceDir = path.join(localesDir, namespace)
    const files = getLanguageFiles(namespaceDir)

    files.forEach((file) => {
      const lang = path.basename(file, ".json")
      languages.add(lang)

      const content = JSON.parse(fs.readFileSync(path.join(namespaceDir, file), "utf-8"))
      keyCount[lang] = (keyCount[lang] || 0) + countKeys(content)
    })
  })

  const enCount = keyCount["en"] || 0
  const completeness: LanguageCompletion = {}

  languages.forEach((lang) => {
    if (lang !== "en") {
      const percent = Math.floor((keyCount[lang]! / enCount) * 100)
      completeness[lang] = percent
    }
  })

  return completeness
}
const __dirname = dirname(fileURLToPath(import.meta.url))

const i18n = calculateCompleteness(path.resolve(__dirname, "../../../../../locales"))
export default i18n
