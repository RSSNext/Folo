import fs from "node:fs"
import path from "node:path"

import yaml from "js-yaml"

const outDir = "./out/make"

function findYmlFiles(dir: string): string[] {
  let results: string[] = []
  const items = fs.readdirSync(dir)

  items.forEach((item) => {
    const fullPath = path.join(dir, item)
    if (fs.statSync(fullPath).isDirectory()) {
      results = results.concat(findYmlFiles(fullPath))
    } else if (item.endsWith(".yml")) {
      results.push(fullPath)
    }
  })

  return results
}

const ymlFiles = findYmlFiles(outDir)

let mergedContent = {
  version: "",
  files: [],
  releaseDate: "",
}

ymlFiles.forEach((file) => {
  const fileContent = fs.readFileSync(file, "utf8")
  const ymlData = yaml.load(fileContent)

  if (!mergedContent.version) {
    mergedContent.version = ymlData.version
  }

  mergedContent = {
    version: ymlData.version,
    files: mergedContent.files.concat(ymlData.files),
    releaseDate: ymlData.releaseDate,
  }
})

const mergedYml = yaml.dump(mergedContent, {
  lineWidth: -1,
})
fs.mkdirSync(path.join(outDir, "merged"), { recursive: true })
const mergedFilePath = path.join(outDir, "merged", path.basename(ymlFiles[0]))
fs.writeFileSync(mergedFilePath, mergedYml)

ymlFiles.forEach((file) => {
  fs.unlinkSync(file)
})
