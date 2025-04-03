import fs from "node:fs"
import path from "node:path"

const sourceDir = "./locales/app"
const targetDir = "./locales/mobile/default"
const keysToCopy: string[] = [
  "sidebar.feed_column.context_menu.mark_as_read",
  "entry_actions.star",
  "entry_actions.share",
  "mark_all_read_button.mark_all_as_read",
  "sidebar.feed_column.context_menu.add_feeds_to_category",
  "sidebar.feed_actions.edit",
  "entry_actions.copy_link",
  "sidebar.feed_actions.unfollow",
  "sidebar.feed_column.context_menu.change_to_other_view",
  "sidebar.feed_column.context_menu.rename_category",
  "sidebar.feed_column.context_menu.delete_category",
  "mark_all_read_button.confirm_mark_all",
  "mark_all_read_button.confirm_mark_all_info",
]
const keysToPlace = [
  "operation.mark_as_read",
  "operation.star",
  "operation.share",
  "operation.mark_all_as_read",
  "operation.add_feeds_to_category",
  "operation.edit",
  "operation.copy_link",
  "operation.unfollow",
  "operation.change_to_other_view",
  "operation.rename_category",
  "operation.delete_category",
  "operation.mark_all_as_read_which",
  "operation.mark_all_as_read_confirm",
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
