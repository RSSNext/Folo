import { createHash } from "node:crypto"
import fs from "node:fs/promises"

import fg from "fast-glob"
import path from "pathe"

export async function calculateMainHash(
  mainDir: string,
  additionalFiles: string[] = [],
): Promise<string> {
  // Get all TypeScript files in the main directory recursively
  const files = fg.globSync("**/*.{ts,tsx}", {
    cwd: mainDir,
    ignore: ["node_modules/**", "dist/**"],
  })

  files.sort()

  const hashSum = createHash("sha256")

  // Read and update hash for each file
  for (const file of files) {
    const content = await fs.readFile(path.join(mainDir, file))
    hashSum.update(content)
  }

  for (const file of additionalFiles) {
    const content = await fs.readFile(file)
    hashSum.update(content)
  }

  return hashSum.digest("hex")
}

async function main() {
  const cwd = process.cwd()
  const hash = await calculateMainHash(path.resolve(cwd, "layer/main"), [
    path.resolve(cwd, "package.json"),
  ])

  const packageJson = JSON.parse(await fs.readFile(path.resolve(cwd, "package.json"), "utf-8"))
  packageJson.mainHash = hash
  await fs.writeFile(path.resolve(cwd, "package.json"), JSON.stringify(packageJson, null, 2))
}

main()
