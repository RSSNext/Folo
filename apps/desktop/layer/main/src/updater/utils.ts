import fs from "node:fs"
import path from "node:path"

import { app } from "electron"
import { major, minor } from "semver"

let _isSquirrelBuild: boolean | null = null
export function isSquirrelBuild() {
  if (typeof _isSquirrelBuild === "boolean") {
    return _isSquirrelBuild
  }

  // if it is squirrel build, there will be 'squirrel.exe'
  // otherwise it is in nsis web mode
  const files = fs.readdirSync(path.dirname(app.getPath("exe")))
  _isSquirrelBuild = files.some((it) => it.includes("squirrel.exe"))

  return _isSquirrelBuild
}

// The following scenario only requires updating the renderer, so the app update is skipped:
// In x.y.z, the update of z will only trigger renderer hotfix, while the update of y requires updating the entire app.
// The hotfix version of x.y.z-beta.0 adds a suffix number. It triggers renderer update. If the main code is modified and the entire app update needs to be triggered, the hotfix version adds a suffix like x.y.z-beta.0.app.
// For subsequent minor versions that require updating the main code, the suffix .app needs to be added.

export const shouldUpdateApp = (currentVersion: string, nextVersion: string) => {
  if (nextVersion.includes("app")) {
    return true
  }
  // x.y.z 's y or x not equal, need update app
  const [x1, x2] = [safeMajor(currentVersion), safeMajor(nextVersion)]
  const [y1, y2] = [safeMinor(currentVersion), safeMinor(nextVersion)]

  // Here, it is not determined whether it is a problem of version number downgrade; the updater will handle it automatically.
  if (x1 !== x2 || y1 !== y2) {
    return true
  }

  return false
}

const safeMajor = (version: string) => {
  try {
    return major(version)
  } catch {
    return "0.0.0"
  }
}
const safeMinor = (version: string) => {
  try {
    return minor(version)
  } catch {
    return "0.0.0"
  }
}
