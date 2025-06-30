import fs from "node:fs"

import path from "pathe"

const PATH_TO_NEW_ICONS_FOLDER = "../SVG 1.36"
const PATH_TO_PROJECT_ICONS_FOLDER = "./icons/mgc"

const loadFiles = (dirPath: string) => {
  // load all files from the new icons folder recursively
  // get file name -> file full path map
  const icons = new Map<string, string>()

  function readFiles(dirPath: string) {
    const files = fs.readdirSync(dirPath)
    files.forEach((file) => {
      const fullPath = path.join(dirPath, file)
      if (fs.statSync(fullPath).isDirectory()) {
        readFiles(fullPath)
      } else {
        icons.set(file, fullPath)
      }
    })
  }

  readFiles(dirPath)

  return icons
}

const newIcons = loadFiles(PATH_TO_NEW_ICONS_FOLDER)
const projectIcons = loadFiles(PATH_TO_PROJECT_ICONS_FOLDER)

// update project icons with new icons
projectIcons.forEach((iconPath, iconName) => {
  const newIconPath = newIcons.get(iconName)
  if (newIconPath) {
    fs.copyFileSync(newIconPath, iconPath)
  }
})
