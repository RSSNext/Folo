import { writeFileSync } from "node:fs"
import { dirname, relative, resolve } from "node:path"
import { inspect } from "node:util"

import glob from "fast-glob"
import type { RouteObject } from "react-router"
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
}

export function routeBuilderPluginV2(options: RouteBuilderPluginOptions = {}): Plugin {
  const {
    pagePattern = "./pages/**/*.tsx",
    outputPath = "./src/generated-routes.ts",
    enableInDev = true,
    transformPath,
  } = options

  let isProduction = false
  let root = ""
  let logger: Logger

  function generateRouteFileContent(
    routes: RouteObject[],
    fileToImportMap: Record<string, string>,
  ): string {
    // Collect all used lazy functions
    const usedLazyFunctions = new Set<string>()
    const lazyFunctionMap = new Map<string, string>()
    let lazyCounter = 0

    // Recursively traverse route tree, collect all used lazy functions
    function collectUsedLazyFunctions(routes: RouteObject[]) {
      routes.forEach((route) => {
        if (route.lazy && route.handle?.fs) {
          const fsPath = route.handle.fs

          // Try to find the corresponding file
          let matchedKey: string | undefined

          // Direct match strategy: according to route-builder.ts logic
          // 1. For grouped routes, fs is segmentPathKey, need to find ${fs}/layout.tsx
          // 2. For layout files, fs is segmentPathKey, need to find ${fs}.tsx
          // 3. For normal pages, fs is ${segmentPathKey}/${normalizeKey}, but the actual file is ${segmentPathKey}.tsx

          // Strategy 1: Direct match fs.tsx
          if (fileToImportMap[`${fsPath}.tsx`]) {
            matchedKey = `${fsPath}.tsx`
          }
          // Strategy 2: layout file (for grouped routes)
          else if (fileToImportMap[`${fsPath}/layout.tsx`]) {
            matchedKey = `${fsPath}/layout.tsx`
          }
          // Strategy 3: index file
          else if (fileToImportMap[`${fsPath}/index.tsx`]) {
            matchedKey = `${fsPath}/index.tsx`
          }
          // Strategy 4: For special path correction
          else {
            // If fsPath ends with /, it might be an index page
            if (fsPath.endsWith("/")) {
              const correctedPath = fsPath.slice(0, -1) // Remove trailing /
              if (fileToImportMap[`${correctedPath}/index.tsx`]) {
                matchedKey = `${correctedPath}/index.tsx`
              } else if (fileToImportMap[`${correctedPath}.tsx`]) {
                matchedKey = `${correctedPath}.tsx`
              }
            }
            // For dynamic routes, remove /:param part, keep file path
            else if (fsPath.includes("/:")) {
              // Handle cases like "./pages/category/[category]/:category"
              // Remove /:param part, keep the previous path
              const correctedPath = fsPath.replace(/\/:[^/]+(?:\/.*)?$/, "")
              if (fileToImportMap[`${correctedPath}.tsx`]) {
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
                  if (fileToImportMap[`${correctedPath}.tsx`]) {
                    matchedKey = `${correctedPath}.tsx`
                  }
                }
              }
            }
          }

          if (matchedKey && fileToImportMap[matchedKey]) {
            const lazyFuncName = `lazy${lazyCounter++}`
            usedLazyFunctions.add(matchedKey)
            lazyFunctionMap.set(matchedKey, lazyFuncName)

            logger.info(
              `[route-builder-v2] Mapped lazy function: ${fsPath} -> ${matchedKey} -> ${lazyFuncName}`,
            )
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
          collectUsedLazyFunctions(route.children)
        }
      })
    }

    collectUsedLazyFunctions(routes)

    // Generate import statements
    const imports: string[] = []
    usedLazyFunctions.forEach((key) => {
      const importPath = fileToImportMap[key]
      const lazyFuncName = lazyFunctionMap.get(key)
      if (importPath && lazyFuncName) {
        imports.push(`const ${lazyFuncName} = () => import("${importPath}")`)
      }
    })

    // Recursively process routes, replace lazy functions and remove handle
    function processRoutes(routes: RouteObject[]): any {
      return routes.map((route) => {
        const newRoute: any = { ...route }

        // Process lazy functions
        if (route.lazy && route.handle?.fs) {
          const fsPath = route.handle.fs

          // Find matching file - use the same matching logic
          let matchedKey: string | undefined

          if (fileToImportMap[`${fsPath}.tsx`]) {
            matchedKey = `${fsPath}.tsx`
          } else if (fileToImportMap[`${fsPath}/layout.tsx`]) {
            matchedKey = `${fsPath}/layout.tsx`
          } else if (fileToImportMap[`${fsPath}/index.tsx`]) {
            matchedKey = `${fsPath}/index.tsx`
          } else {
            // For special path correction
            if (fsPath.endsWith("/")) {
              const correctedPath = fsPath.slice(0, -1) // Remove trailing /
              if (fileToImportMap[`${correctedPath}/index.tsx`]) {
                matchedKey = `${correctedPath}/index.tsx`
              } else if (fileToImportMap[`${correctedPath}.tsx`]) {
                matchedKey = `${correctedPath}.tsx`
              }
            }
            // For dynamic routes, remove /:param part, keep file path
            else if (fsPath.includes("/:")) {
              // Handle cases like "./pages/category/[category]/:category"
              // Remove /:param part, keep the previous path
              const correctedPath = fsPath.replace(/\/:[^/]+(?:\/.*)?$/, "")
              if (fileToImportMap[`${correctedPath}.tsx`]) {
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
                  if (fileToImportMap[`${correctedPath}.tsx`]) {
                    matchedKey = `${correctedPath}.tsx`
                  }
                }
              }
            }
          }

          if (matchedKey && lazyFunctionMap.has(matchedKey)) {
            newRoute.lazy = `__LAZY_${lazyFunctionMap.get(matchedKey)}__`
          } else {
            // If no matching file is found, delete lazy property
            delete newRoute.lazy
            logger.warn(`[route-builder-v2] No lazy function for route: ${fsPath}`)
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

    // Convert routes object to string and replace lazy function placeholders
    const routesString = JSON.stringify(processedRoutes, null, 2).replaceAll(
      /"__LAZY_(\w+)__"/g,
      "$1",
    )

    return `// This file is auto-generated by vite-plugin-route-builder
// Do not edit manually
/* eslint-disable */
// @ts-nocheck

import type { RouteObject } from "react-router"

// Lazy imports for page components
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

        // Remove .tsx extension
        importPath = importPath.replace(/\.tsx$/, "")

        globObject[routeKey] = () => Promise.resolve({ default: () => null })
        fileToImportMap[routeKey] = importPath

        logger.info(`[route-builder-v2] Mapped: ${routeKey} -> ${importPath}`)
      })

      // Use existing route building logic
      const routes = buildGlobRoutes(globObject)

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
        if (relativePath.includes("/pages/") && relativePath.endsWith(".tsx")) {
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
