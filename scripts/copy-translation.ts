import fs from "node:fs"
import path from "node:path"

const sourceDir = "./locales/app"
const targetDir = "./locales/mobile/default"
const keysToCopy: string[] = ["feed_item.error_since"]
const keysToPlace = ["operation.error_since"]

const copyTranslations = (sourceDir: string, targetDir: string) => {
  const sourceFiles = fs.readdirSync(sourceDir)

  sourceFiles.forEach((file) => {
    const sourceFilePath = path.join(sourceDir, file)
    const targetFilePath = path.join(targetDir, file)

    if (fs.statSync(sourceFilePath).isDirectory()) {
      // Recursively copy translations from subdirectories
      copyTranslations(sourceFilePath, targetFilePath)
    } else if (path.extname(file) === ".json") {
      const sourceContent = JSON.parse(fs.readFileSync(sourceFilePath, "utf-8"))
      const targetContent = fs.existsSync(targetFilePath)
        ? JSON.parse(fs.readFileSync(targetFilePath, "utf-8"))
        : {}

      keysToCopy.forEach((key, index) => {
        const targetKey = keysToPlace[index] ?? key
        if (sourceContent[key] && !targetContent[targetKey]) {
          targetContent[targetKey] = sourceContent[key]
        }
      })

      fs.writeFileSync(targetFilePath, `${JSON.stringify(targetContent, null, 2)}\n`)
    }
  })
}

copyTranslations(sourceDir, targetDir)
