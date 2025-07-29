import { spawn } from "node:child_process"
import fs from "node:fs"
import fsp from "node:fs/promises"
import { fileURLToPath } from "node:url"

import { getConfig } from "@expo/config"
import { dirname, join } from "pathe"

import { version } from "../package.json"

async function spawnAsync(command: string, args: string[]) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "inherit", shell: true })
    child.on("close", (code) => {
      if (code === 0) {
        resolve(void 0)
      } else {
        reject(new Error(`Command failed with exit code ${code}`))
      }
    })
  })
}

async function main() {
  await spawnAsync("expo", ["export", "-p", "ios", "-p", "android"])

  const __dirname = dirname(fileURLToPath(import.meta.url))
  const projectDir = join(__dirname, "..")

  const expoUpdatesServerRoot = join(projectDir, "../", "../", "../", "expo-updates-server")
  const timestamp = Date.now()
  const updatesFolder = join(expoUpdatesServerRoot, "updates", version, `${timestamp}`)

  if (!fs.existsSync(updatesFolder)) {
    fs.mkdirSync(updatesFolder, { recursive: true })
  }

  // cp dist to expo-updates-server
  const distFolder = join(projectDir, "dist")
  await fsp.cp(distFolder, updatesFolder, { recursive: true })

  const { exp } = getConfig(projectDir, {
    skipSDKVersionRequirement: true,
    isPublicConfig: true,
  })

  const expoConfig = JSON.stringify(exp, null, 2)
  const expoConfigPath = join(updatesFolder, "expoConfig.json")
  fs.writeFileSync(expoConfigPath, expoConfig)
}

main()
