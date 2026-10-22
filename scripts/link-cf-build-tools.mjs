// cf runs the build tool that a Worker package declares (Wrangler or the Cloudflare Vite plugin),
// but it only looks for it in that package's own node_modules. This workspace hoists every
// dependency to the root node_modules (`nodeLinker: hoisted`), so after each install, link the
// hoisted copy into every app that has a cloudflare.config.ts.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const BUILD_TOOLS = ["wrangler", "@cloudflare/vite-plugin"]

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const appsDir = path.join(root, "apps")

function linkBuildTool(appDir, tool) {
  const target = path.join(root, "node_modules", tool)
  const link = path.join(appDir, "node_modules", tool)
  if (fs.existsSync(path.join(link, "package.json"))) return
  if (!fs.existsSync(path.join(target, "package.json"))) return

  // Replace a dangling link left by an earlier install
  if (fs.lstatSync(link, { throwIfNoEntry: false })?.isSymbolicLink()) fs.unlinkSync(link)

  fs.mkdirSync(path.dirname(link), { recursive: true })
  if (process.platform === "win32") {
    fs.symlinkSync(target, link, "junction")
  } else {
    fs.symlinkSync(path.relative(path.dirname(link), target), link)
  }
}

for (const app of fs.readdirSync(appsDir)) {
  const appDir = path.join(appsDir, app)
  if (!fs.existsSync(path.join(appDir, "cloudflare.config.ts"))) continue

  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(appDir, "package.json"), "utf8"))
    const declared = { ...manifest.dependencies, ...manifest.devDependencies }
    for (const tool of BUILD_TOOLS) {
      if (tool in declared) linkBuildTool(appDir, tool)
    }
  } catch (error) {
    // Never fail the install; cf reports the missing build tool when it runs
    console.warn(`[link-cf-build-tools] apps/${app}: ${error.message}`)
  }
}
