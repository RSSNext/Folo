import { writeFileSync } from "node:fs"
import { inspect } from "node:util"

import glob from "fast-glob"
import { dirname, relative, resolve } from "pathe"
import type { Logger, Plugin } from "vite"

import { buildGlobRoutes } from "./utils/route-builder"

export interface RouteBuilderPluginOptions {
  /** Page files glob pattern */
  pagePattern?: string
  /** Output path for generated routes */
  outputPath?: string
  /** Whether to enable in dev mode */
  enableInDev?: boolean
  /** Custom file to route path transformation logic */
  transformPath?: (path: string) => string
  /** Whether to disable logging */
  debug?: boolean
  /** Custom order for segment groups in route tree. Array of group names (with or without parentheses). Default: filesystem order */
  segmentGroupOrder?: string[]
}

export function routeBuilderPluginV2(options: RouteBuilderPluginOptions = {}): Plugin {
  const {
    pagePattern = "./pages/**/*.{tsx,sync.tsx}",
    outputPath = "./src/generated-routes.ts",
    enableInDev = true,
    transformPath,
    debug = false,
    segmentGroupOrder = [],
  } = options

  let isProduction = false
  let root = ""
  let logger: Logger

  function generateRouteFileContent(
    routes: any[],
    fileToImportMap: Record<string, string>,
  ): string {
    // Collect all used lazy functions and sync imports
    const usedLazyFunctions = new Set<string>()
    const usedSyncImports = new Set<string>()
    const lazyFunctionMap = new Map<string, string>()
    const syncImportMap = new Map<string, string>()
    let lazyCounter = 0
    let syncCounter = 0

    // Recursively traverse route tree, collect all used functions
    function collectUsedFunctions(routes: any[]) {
      routes.forEach((route) => {
        if (route.lazy && route.handle?.fs) {
          const fsPath = route.handle.fs
          const { isSync } = route.handle

          // Try to find the corresponding file
          let matchedKey: string | undefined

          // Strategy 1: Direct match with sync extension
          if (isSync && fileToImportMap[`${fsPath}.sync.tsx`]) {
            matchedKey = `${fsPath}.sync.tsx`
          }
          // Strategy 2: Direct match with normal extension
          else if (fileToImportMap[`${fsPath}.tsx`]) {
            matchedKey = `${fsPath}.tsx`
          }
          // Strategy 3: layout file (for grouped routes) - sync
          else if (isSync && fileToImportMap[`${fsPath}/layout.sync.tsx`]) {
            matchedKey = `${fsPath}/layout.sync.tsx`
          }
          // Strategy 4: layout file (for grouped routes) - async
          else if (fileToImportMap[`${fsPath}/layout.tsx`]) {
            matchedKey = `${fsPath}/layout.tsx`
          }
          // Strategy 5: index file - sync
          else if (isSync && fileToImportMap[`${fsPath}/index.sync.tsx`]) {
            matchedKey = `${fsPath}/index.sync.tsx`
          }
          // Strategy 6: index file - async
          else if (fileToImportMap[`${fsPath}/index.tsx`]) {
            matchedKey = `${fsPath}/index.tsx`
          }
          // Strategy 7: For special path correction
          else {
            // If fsPath ends with /, it might be an index page
            if (fsPath.endsWith("/")) {
              const correctedPath = fsPath.slice(0, -1) // Remove trailing /
              if (isSync && fileToImportMap[`${correctedPath}/index.sync.tsx`]) {
                matchedKey = `${correctedPath}/index.sync.tsx`
              } else if (fileToImportMap[`${correctedPath}/index.tsx`]) {
                matchedKey = `${correctedPath}/index.tsx`
              } else if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
                matchedKey = `${correctedPath}.sync.tsx`
              } else if (fileToImportMap[`${correctedPath}.tsx`]) {
                matchedKey = `${correctedPath}.tsx`
              }
            }
            // For dynamic routes, remove /:param part, keep file path
            else if (fsPath.includes("/:")) {
              const correctedPath = fsPath.replace(/\/:[^/]+(?:\/.*)?$/, "")
              if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
                matchedKey = `${correctedPath}.sync.tsx`
              } else if (fileToImportMap[`${correctedPath}.tsx`]) {
                matchedKey = `${correctedPath}.tsx`
              }
            }
            // If fsPath ends with a repeated path segment, remove the last segment
            else {
              const pathParts = fsPath.split("/")
              if (pathParts.length >= 2) {
                const lastPart = pathParts.at(-1)
                const secondLastPart = pathParts.at(-2)

                // If the last two path segments are the same, remove the last one
                if (lastPart === secondLastPart) {
                  const correctedPath = pathParts.slice(0, -1).join("/")
                  if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
                    matchedKey = `${correctedPath}.sync.tsx`
                  } else if (fileToImportMap[`${correctedPath}.tsx`]) {
                    matchedKey = `${correctedPath}.tsx`
                  }
                }
              }
            }
          }

          if (matchedKey && fileToImportMap[matchedKey]) {
            if (isSync) {
              const syncImportName = `SyncComponent${syncCounter++}`
              usedSyncImports.add(matchedKey)
              syncImportMap.set(matchedKey, syncImportName)
              if (debug) {
                logger.info(
                  `[route-builder-v2] Mapped sync import: ${fsPath} -> ${matchedKey} -> ${syncImportName}`,
                )
              }
            } else {
              const lazyFuncName = `lazy${lazyCounter++}`
              usedLazyFunctions.add(matchedKey)
              lazyFunctionMap.set(matchedKey, lazyFuncName)
              if (debug) {
                logger.info(
                  `[route-builder-v2] Mapped lazy function: ${fsPath} -> ${matchedKey} -> ${lazyFuncName}`,
                )
              }
            }
          } else {
            logger.warn(`[route-builder-v2] Could not find file for fs path: ${fsPath}`)
            logger.warn(
              `[route-builder-v2] Available file keys: ${inspect(Object.keys(fileToImportMap), {
                depth: null,
              })}`,
            )
          }
        }

        if (route.children) {
          collectUsedFunctions(route.children)
        }
      })
    }

    collectUsedFunctions(routes)

    // Generate import statements
    const imports: string[] = []

    // Generate sync imports
    usedSyncImports.forEach((key) => {
      const importPath = fileToImportMap[key]
      const syncImportName = syncImportMap.get(key)
      if (importPath && syncImportName) {
        // Use import * as to avoid errors when loader doesn't exist
        imports.push(`import * as ${syncImportName} from "${importPath}"`)
      }
    })

    // Generate lazy imports
    usedLazyFunctions.forEach((key) => {
      const importPath = fileToImportMap[key]
      const lazyFuncName = lazyFunctionMap.get(key)
      if (importPath && lazyFuncName) {
        imports.push(`const ${lazyFuncName} = () => import("${importPath}")`)
      }
    })

    // Recursively process routes, replace lazy functions and remove handle
    function processRoutes(routes: any[]): any {
      return routes.map((route) => {
        const newRoute: any = { ...route }

        // Process lazy functions and sync imports
        if (route.lazy && route.handle?.fs) {
          const fsPath = route.handle.fs
          const { isSync } = route.handle

          // Find matching file - use the same matching logic
          let matchedKey: string | undefined

          if (isSync && fileToImportMap[`${fsPath}.sync.tsx`]) {
            matchedKey = `${fsPath}.sync.tsx`
          } else if (fileToImportMap[`${fsPath}.tsx`]) {
            matchedKey = `${fsPath}.tsx`
          } else if (isSync && fileToImportMap[`${fsPath}/layout.sync.tsx`]) {
            matchedKey = `${fsPath}/layout.sync.tsx`
          } else if (fileToImportMap[`${fsPath}/layout.tsx`]) {
            matchedKey = `${fsPath}/layout.tsx`
          } else if (isSync && fileToImportMap[`${fsPath}/index.sync.tsx`]) {
            matchedKey = `${fsPath}/index.sync.tsx`
          } else if (fileToImportMap[`${fsPath}/index.tsx`]) {
            matchedKey = `${fsPath}/index.tsx`
          } else {
            // For special path correction
            if (fsPath.endsWith("/")) {
              const correctedPath = fsPath.slice(0, -1) // Remove trailing /
              if (isSync && fileToImportMap[`${correctedPath}/index.sync.tsx`]) {
                matchedKey = `${correctedPath}/index.sync.tsx`
              } else if (fileToImportMap[`${correctedPath}/index.tsx`]) {
                matchedKey = `${correctedPath}/index.tsx`
              } else if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
                matchedKey = `${correctedPath}.sync.tsx`
              } else if (fileToImportMap[`${correctedPath}.tsx`]) {
                matchedKey = `${correctedPath}.tsx`
              }
            }
            // For dynamic routes, remove /:param part, keep file path
            else if (fsPath.includes("/:")) {
              const correctedPath = fsPath.replace(/\/:[^/]+(?:\/.*)?$/, "")
              if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
                matchedKey = `${correctedPath}.sync.tsx`
              } else if (fileToImportMap[`${correctedPath}.tsx`]) {
                matchedKey = `${correctedPath}.tsx`
              }
            }
            // For repeated path segments, try removing the last segment
            else {
              const pathParts = fsPath.split("/")
              if (pathParts.length >= 2) {
                const lastPart = pathParts.at(-1)
                const secondLastPart = pathParts.at(-2)

                // If the last two path segments are the same, remove the last one
                if (lastPart === secondLastPart) {
                  const correctedPath = pathParts.slice(0, -1).join("/")
                  if (isSync && fileToImportMap[`${correctedPath}.sync.tsx`]) {
                    matchedKey = `${correctedPath}.sync.tsx`
                  } else if (fileToImportMap[`${correctedPath}.tsx`]) {
                    matchedKey = `${correctedPath}.tsx`
                  }
                }
              }
            }
          }

          if (matchedKey) {
            if (isSync && syncImportMap.has(matchedKey)) {
              // For sync imports, use Component property instead of lazy
              const syncComponentName = syncImportMap.get(matchedKey)
              newRoute.Component = `__SYNC_${syncComponentName}.Component__`
              // Conditionally add loader if it exists
              newRoute.loader = `__SYNC_${syncComponentName}.loader__`
              delete newRoute.lazy
            } else if (lazyFunctionMap.has(matchedKey)) {
              newRoute.lazy = `__LAZY_${lazyFunctionMap.get(matchedKey)}__`
            } else {
              // If no matching function is found, delete lazy property
              delete newRoute.lazy
              logger.warn(`[route-builder-v2] No function for route: ${fsPath}`)
            }
          } else {
            delete newRoute.lazy
            logger.warn(`[route-builder-v2] No matching file for route: ${fsPath}`)
          }
        }

        // Remove handle property
        delete newRoute.handle

        // Recursively process children
        if (route.children) {
          newRoute.children = processRoutes(route.children)
        }

        return newRoute
      })
    }

    const processedRoutes = processRoutes(routes)

    // Convert routes object to string and replace function placeholders
    const routesString = JSON.stringify(processedRoutes, null, 2)
      .replaceAll(/"__LAZY_(\w+)__"/g, "$1")
      .replaceAll(/"__SYNC_([^.]+)\.Component__"/g, "$1.Component")
      .replaceAll(/"__SYNC_([^.]+)\.loader__"/g, "$1.loader")
      // Remove loader property if it's undefined
      .replaceAll(/,?\s*"loader":\s*undefined/g, "")

    return `// This file is auto-generated by vite-plugin-route-builder
// Do not edit manually
/* eslint-disable */
// @ts-nocheck

import type { RouteObject } from "react-router"

// Imports for page components
${imports.join("\n")}

// Generated route configuration
export const routes: RouteObject[] = ${routesString}

export default routes
`
  }

  function generateRoutes() {
    try {
      const pageFiles = glob.sync(pagePattern, {
        cwd: root,
        absolute: true,
      })

      logger.info(`[route-builder-v2] Found ${pageFiles.length} page files`)

      // Build glob object, key is the relative path to pages directory
      const globObject: Record<string, () => Promise<any>> = {}
      const fileToImportMap: Record<string, string> = {}

      pageFiles.forEach((absolutePath) => {
        // Get relative path to root
        const relativePath = relative(root, absolutePath)

        // Convert to ./pages/ format for route-builder
        let routeKey: string
        if (relativePath.includes("/pages/")) {
          routeKey = `./pages/${relativePath.split("/pages/")[1]}`
        } else if (relativePath.includes("\\pages\\")) {
          routeKey = `./pages/${relativePath.split("\\pages\\")[1]?.replaceAll("\\", "/")}`
        } else {
          // Assume file is in pages directory
          routeKey = `./${relativePath.replaceAll("\\", "/")}`
        }

        // Apply custom path transformation
        if (transformPath) {
          routeKey = transformPath(routeKey)
        }

        // Generate relative path for import (relative to output file)
        const outputDir = dirname(resolve(root, outputPath))
        let importPath = relative(outputDir, absolutePath)

        // Ensure correct path separator
        importPath = importPath.replaceAll("\\", "/")

        // Ensure relative path starts with ./ or ../
        if (!importPath.startsWith(".")) {
          importPath = `./${importPath}`
        }

        // Store the import path with different handling for sync vs async
        let finalImportPath: string
        if (importPath.endsWith(".sync.tsx")) {
          // For sync files, remove .tsx but keep .sync for the import path
          finalImportPath = importPath.replace(/\.tsx$/, "")
        } else {
          // For async files, remove .tsx extension
          finalImportPath = importPath.replace(/\.tsx$/, "")
        }

        globObject[routeKey] = () => Promise.resolve({ default: () => null })
        fileToImportMap[routeKey] = finalImportPath

        if (debug) {
          logger.info(`[route-builder-v2] Mapped: ${routeKey} -> ${finalImportPath}`)
        }
      })

      // Use existing route building logic
      const routes = buildGlobRoutes(globObject, { segmentGroupOrder })

      // Generate route file content
      const routeFileContent = generateRouteFileContent(routes, fileToImportMap)

      const outputFilePath = resolve(root, outputPath)
      writeFileSync(outputFilePath, routeFileContent, "utf-8")

      logger.info(`[route-builder-v2] Generated routes: ${outputFilePath}`)
    } catch (error: any) {
      logger.error(`[route-builder-v2] Error generating routes:${error.message}`)
      console.error(error)
      throw error
    }
  }

  return {
    name: "vite-plugin-route-builder-v2",
    configResolved(config) {
      isProduction = config.command === "build"
      root = config.root
      logger = config.logger
    },

    buildStart() {
      if (isProduction || enableInDev) {
        generateRoutes()
      }
    },

    configureServer(server) {
      if (!enableInDev) return

      const watchPattern = resolve(root, pagePattern.replace("./", ""))
      server.watcher.add(watchPattern)

      server.watcher.on("add", handleFileChange)
      server.watcher.on("unlink", handleFileChange)

      function handleFileChange(path: string) {
        const relativePath = relative(root, path)
        if (
          relativePath.includes("/pages/") &&
          (relativePath.endsWith(".tsx") || relativePath.endsWith(".sync.tsx"))
        ) {
          logger.info(`[route-builder-v2] Page file changed: ${relativePath}`)
          generateRoutes()

          // Send custom HMR event
          server.ws.send({
            type: "custom",
            event: "routes-updated",
            data: { timestamp: Date.now() },
          })
        }
      }
    },
  }
}

export default routeBuilderPluginV2
