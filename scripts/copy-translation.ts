import fs from "node:fs"

import path from "pathe"

const sourceDir = "./locales/app"
const targetDir = "./locales/mobile/default"
const keysToCopy: string[] = [
  "feed_form.title",
  "feed_form.title_description",
  "feed_form.category",
  "feed_form.category_description",
  "feed_form.private_follow",
  "feed_form.private_follow_description",
  "feed_form.view",
]
const keysToPlace = [
  "subscription_form.title",
  "subscription_form.title_description",
  "subscription_form.category",
  "subscription_form.category_description",
  "subscription_form.private_follow",
  "subscription_form.private_follow_description",
  "subscription_form.view",
]

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
