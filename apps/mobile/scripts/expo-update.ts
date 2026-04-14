import { spawn } from "node:child_process"
import { fileURLToPath } from "node:url"

import { dirname, join } from "pathe"

async function spawnAsync(command: string, args: string[], cwd: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    })

    child.on("close", (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`Command failed with exit code ${code}: ${command} ${args.join(" ")}`))
    })
  })
}

async function main() {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const projectDir = join(__dirname, "..")
  const bundleScriptPath = join(
    projectDir,
    "..",
    "..",
    ".github",
    "scripts",
    "build-ota-release.mjs",
  )

  await spawnAsync("pnpm", ["run", "update:export"], projectDir)
  await spawnAsync(process.execPath, [bundleScriptPath], projectDir)
}

main()
