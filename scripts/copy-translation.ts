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
  // kept the duplicate keys in locales/app
  "words.starred",
  "words.inbox",
  "words.feeds",
  "words.lists",
  "words.search",
  "discover.category.all",
  "discover.category.anime",
  "discover.category.bbs",
  "discover.category.blog",
  "discover.category.design",
  "discover.category.finance",
  "discover.category.forecast",
  "discover.category.game",
  "discover.category.government",
  "discover.category.journal",
  "discover.category.live",
  "discover.category.multimedia",
  "discover.category.new-media",
  "discover.category.picture",
  "discover.category.program-update",
  "discover.category.programming",
  "discover.category.reading",
  "discover.category.shopping",
  "discover.category.social-media",
  "discover.category.study",
  "discover.category.traditional-media",
  "discover.category.travel",
  "discover.category.university",
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
