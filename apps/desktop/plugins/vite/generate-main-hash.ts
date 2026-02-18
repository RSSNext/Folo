import { createHash } from "node:crypto"
import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"

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
  const packageJsonPath = path.resolve(cwd, "package.json")
  const hash = await calculateMainHash(path.resolve(cwd, "layer/main"), [packageJsonPath])

  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"))
  packageJson.mainHash = hash

  const nextPackageJson = `${JSON.stringify(packageJson, null, 2)}\n`
  const tempPackageJsonPath = `${packageJsonPath}.tmp`
  await fs.writeFile(tempPackageJsonPath, nextPackageJson, "utf-8")
  await fs.rename(tempPackageJsonPath, packageJsonPath)
}

const isExecutedDirectly = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false

if (isExecutedDirectly) {
  void main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
