import { red, yellow } from "kolorist"
import path from "pathe"
import type { HmrContext, Plugin } from "vite"

function isNodeWithinCircularImports(
  node: any,
  nodeChain: any[],
  currentChain: any[] = [node],
  traversedModules = new Set<any>(),
): string[] | null {
  if (traversedModules.has(node)) {
    return null
  }
  traversedModules.add(node)

  for (const importer of node.importers) {
    if (importer === node) continue

    const importerIndex = nodeChain.indexOf(importer)
    if (importerIndex !== -1) {
      const importChain = [
        importer,
        ...[...currentChain].reverse(),
        ...nodeChain.slice(importerIndex, -1).reverse(),
      ].map((m) => path.relative(process.cwd(), m.file))

      return importChain
    }

    if (!currentChain.includes(importer)) {
      const result = isNodeWithinCircularImports(
        importer,
        nodeChain,
        currentChain.concat(importer),
        traversedModules,
      )
      if (result) return result
    }
  }
  return null
}

export const circularImportRefreshPlugin = (): Plugin => ({
  name: "circular-import-refresh",
  configureServer(server) {
    server.ws.on("message", (message) => {
      console.info(message)
    })
  },
  handleHotUpdate({ file, server }: HmrContext) {
    const mod = server.moduleGraph.getModuleById(file)

    // Check for circular imports
    if (mod) {
      const circularPaths = isNodeWithinCircularImports(mod, [mod])
      if (circularPaths) {
        console.warn(yellow(`Circular imports detected: \n${circularPaths.join("\n↳  ")}`))

        // Check if any path in the circular dependency contains 'store/'
        const hasStoreFile = circularPaths.some((path) => path.includes("store/"))

        if (hasStoreFile) {
          console.error(
            red(
              `Circular dependency detected in ${file} involving store files. Performing full page refresh.`,
            ),
          )
          server.ws.send({ type: "full-reload" })
          return []
        } else {
          console.warn(
            yellow(
              `Circular dependency detected. HMR might not work correctly, if page has some un-expected behavior please refresh the page manually.`,
            ),
          )
        }
      }
    }

    if (file.startsWith(path.resolve(process.cwd(), "src/store")) && file.endsWith(".ts")) {
      console.warn(yellow(`[memory-hmr] Detected change in store file: ${file}. Reloading page.`))
      server.ws.send({ type: "full-reload" })
      return []
    }
  },
})
