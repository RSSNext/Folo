import fs from "node:fs"
import path from "node:path"

const sourceDir = "./locales/app"
const targetDir = "./locales/common"
const keysToCopy: string[] = [
  "feed_view_type.articles",
  "feed_view_type.audios",
  "feed_view_type.notifications",
  "feed_view_type.pictures",
  "feed_view_type.social_media",
  "feed_view_type.videos",
  "words.starred",
  "words.inbox",
  "words.feeds",
  "words.lists",
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

      keysToCopy.forEach((key) => {
        if (sourceContent[key] && !targetContent[key]) {
          targetContent[key] = sourceContent[key]
        }
      })

      fs.writeFileSync(targetFilePath, `${JSON.stringify(targetContent, null, 2)}\n`)
    }
  })
}

copyTranslations(sourceDir, targetDir)
