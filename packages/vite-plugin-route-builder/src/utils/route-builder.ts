import { get, omit } from "es-toolkit/compat"
import type { RouteObject } from "react-router"

type NestedStructure = { [key: string]: NestedStructure }

function nestPaths(paths: string[]): NestedStructure {
  const result: NestedStructure = {}

  paths.forEach((path) => {
    // Remove the './pages' prefix and the '.tsx' suffix
    const prefix = "./pages/"
    const suffix = ".tsx"
    const trimmedPath = path.slice(prefix.length, -suffix.length)

    const parts = trimmedPath.split("/")

    let currentLevel = result
    for (const part of parts) {
      if (!currentLevel[part]) {
        currentLevel[part] = {}
      }
      currentLevel = currentLevel[part]
    }
  })

  return result
}

export function buildGlobRoutes(glob: Record<string, () => Promise<any>>): RouteObject[] {
  const keys = Object.keys(glob)
  const paths = nestPaths(keys)
  const pathGetterSet = new Set<string>()

  const routeObject: RouteObject[] = []

  function dfsRoutes(
    parentKey: string,
    children: RouteObject[],
    paths: NestedStructure,

    parentPath = "",
  ) {
    const pathKeys = Object.keys(paths)
    // sort `layout` to the start, and `index` to the end
    pathKeys.sort((a, b) => {
      if (a === "layout") {
        return -1
      }
      if (b === "layout") {
        return 1
      }
      if (a === "index") {
        return 1
      }
      if (b === "index") {
        return -1
      }
      return a.localeCompare(b)
    })

    // sort, if () group, then move to the end
    pathKeys.sort((a, b) => {
      if (a.startsWith("(") && a.endsWith(")")) {
        return 1
      }
      if (b.startsWith("(") && b.endsWith(")")) {
        return -1
      }
      return 0
    })

    // TODO biz priority
    // move `(main)` to the top
    const mainIndex = pathKeys.indexOf("(main)")
    if (mainIndex !== -1) {
      pathKeys.splice(mainIndex, 1)
      pathKeys.unshift("(main)")
    }

    for (const key of pathKeys) {
      const isGroupedRoute = key.startsWith("(") && key.endsWith(")")

      const segmentPathKey = parentKey + key

      if (isGroupedRoute) {
        const accessPath = `${segmentPathKey}/layout.tsx`
        const globGetter = get(glob, accessPath) || undefined
        if (pathGetterSet.has(accessPath)) {
          // throw new Error(`duplicate path: ` + accessPath)

          console.error(`duplicate path: ${accessPath}`)
        }
        pathGetterSet.add(accessPath)

        // if (!globGetter) {
        //   throw new Error("grouped route must have a layout file")
        // }

        const childrenChildren: RouteObject[] = []
        dfsRoutes(`${segmentPathKey}/`, childrenChildren, paths[key]!, parentPath)
        children.push({
          path: "",
          lazy: globGetter,
          children: childrenChildren,
          handle: {
            fs: segmentPathKey,
            fullPath: parentPath,
          },
        })
      } else if (key === "layout") {
        // if parent key is grouped routes, the layout is handled, so skip this logic
        if (parentKey.endsWith(")/")) {
          continue
        }
        // if `key` is `layout`, then it's a grouped route
        const accessPath = `${segmentPathKey}.tsx`
        const globGetter = get(glob, accessPath)

        const childrenChildren: RouteObject[] = []
        // should omit layout, because layout is already handled
        dfsRoutes(parentKey, childrenChildren, omit(paths, "layout") as NestedStructure, parentPath)
        children.push({
          path: "",
          lazy: globGetter,
          children: childrenChildren,
          handle: {
            fs: segmentPathKey,
            fullPath: parentPath,
          },
        })
        break
      } else {
        const content = paths[key]!
        const hasChild = Object.keys(content).length > 0

        const normalizeKey = normalizePathKey(key)

        if (!hasChild) {
          const accessPath = `${segmentPathKey}.tsx`
          const globGetter = get(glob, accessPath)

          if (pathGetterSet.has(`${segmentPathKey}.tsx`)) {
            // throw new Error(`duplicate path: ` + accessPath)
            console.error(`duplicate path: ${accessPath}`)
            // continue
          }
          pathGetterSet.add(accessPath)

          children.push({
            path: normalizeKey,
            lazy: globGetter,
            handle: {
              fs: `${segmentPathKey}/${normalizeKey}`,
              fullPath: `${parentPath}/${normalizeKey}`,
            },
          })
        } else {
          const childrenChildren: RouteObject[] = []
          const fullPath = `${parentPath}/${normalizeKey}`
          dfsRoutes(`${segmentPathKey}/`, childrenChildren, paths[key]!, fullPath)
          children.push({
            path: normalizeKey,
            children: childrenChildren,
            handle: {
              fs: `${segmentPathKey}/${normalizeKey}`,
              fullPath,
            },
          })
        }
      }
    }
  }

  dfsRoutes("./pages/", routeObject, paths)
  return routeObject
}

const normalizePathKey = (key: string) => {
  if (key === "index") {
    return ""
  }

  if (key.startsWith("[") && key.endsWith("]")) {
    return `:${key.slice(1, -1)}`
  }
  return key
}
