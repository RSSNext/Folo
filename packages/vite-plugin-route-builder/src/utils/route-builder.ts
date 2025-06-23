import { get, omit } from "es-toolkit/compat"

type NestedStructure = { [key: string]: NestedStructure }

function nestPaths(paths: string[]): NestedStructure {
  const result: NestedStructure = {}

  paths.forEach((path) => {
    // Remove the './pages' prefix and the file extension
    const prefix = "./pages/"
    let suffix = ".tsx"
    let trimmedPath: string

    // Check if it's a .sync.tsx file
    if (path.endsWith(".sync.tsx")) {
      suffix = ".sync.tsx"
      trimmedPath = path.slice(prefix.length, -suffix.length)
    } else {
      trimmedPath = path.slice(prefix.length, -suffix.length)
    }

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

// Extended RouteObject to include sync loading information
interface ExtendedRouteObject {
  path?: string
  index?: boolean
  children?: ExtendedRouteObject[]
  lazy?: any
  handle?: {
    fs: string
    fullPath: string
    isSync?: boolean
  }
}

export function buildGlobRoutes(
  glob: Record<string, () => Promise<any>>,
  options: { segmentGroupOrder?: string[] } = {},
): ExtendedRouteObject[] {
  const keys = Object.keys(glob)
  const paths = nestPaths(keys)
  const pathGetterSet = new Set<string>()
  const { segmentGroupOrder = [] } = options

  const routeObject: ExtendedRouteObject[] = []

  function dfsRoutes(
    parentKey: string,
    children: ExtendedRouteObject[],
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

    // Custom segment group ordering based on segmentGroupOrder option
    if (segmentGroupOrder.length > 0) {
      pathKeys.sort((a, b) => {
        const isAGroup = a.startsWith("(") && a.endsWith(")")
        const isBGroup = b.startsWith("(") && b.endsWith(")")

        // If both are groups, sort by the custom order
        if (isAGroup && isBGroup) {
          // Support both formats: "(main)" and "main"
          const aIndex = segmentGroupOrder.findIndex(
            (item) => item === a || item === a.slice(1, -1),
          )
          const bIndex = segmentGroupOrder.findIndex(
            (item) => item === b || item === b.slice(1, -1),
          )

          // If both are in the custom order, sort by their position
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex
          }
          // If only a is in custom order, a comes first
          if (aIndex !== -1 && bIndex === -1) {
            return -1
          }
          // If only b is in custom order, b comes first
          if (aIndex === -1 && bIndex !== -1) {
            return 1
          }
          // If neither is in custom order, use filesystem order (localeCompare)
          return a.localeCompare(b)
        }

        return 0 // Non-groups maintain their existing sort order
      })
    }

    for (const key of pathKeys) {
      const isGroupedRoute = key.startsWith("(") && key.endsWith(")")

      const segmentPathKey = parentKey + key

      if (isGroupedRoute) {
        // Check for both sync and async layout files
        const syncLayoutPath = `${segmentPathKey}/layout.sync.tsx`
        const asyncLayoutPath = `${segmentPathKey}/layout.tsx`

        let accessPath: string
        let isSync = false
        const syncGlobGetter = get(glob, syncLayoutPath)
        let globGetter

        if (syncGlobGetter) {
          accessPath = syncLayoutPath
          isSync = true
          globGetter = syncGlobGetter
        } else {
          accessPath = asyncLayoutPath
          globGetter = get(glob, accessPath) || undefined
        }

        if (pathGetterSet.has(accessPath)) {
          console.error(`duplicate path: ${accessPath}`)
        }
        pathGetterSet.add(accessPath)

        const childrenChildren: ExtendedRouteObject[] = []
        dfsRoutes(`${segmentPathKey}/`, childrenChildren, paths[key]!, parentPath)
        children.push({
          path: "",
          lazy: globGetter,
          children: childrenChildren,
          handle: {
            fs: segmentPathKey,
            fullPath: parentPath,
            isSync,
          },
        })
      } else if (key === "layout") {
        // if parent key is grouped routes, the layout is handled, so skip this logic
        if (parentKey.endsWith(")/")) {
          continue
        }

        // Check for both sync and async layout files
        const syncLayoutPath = `${segmentPathKey}.sync.tsx`
        const asyncLayoutPath = `${segmentPathKey}.tsx`

        let isSync = false
        const syncGlobGetter = get(glob, syncLayoutPath)
        let globGetter

        if (syncGlobGetter) {
          isSync = true
          globGetter = syncGlobGetter
        } else {
          globGetter = get(glob, asyncLayoutPath)
        }

        const childrenChildren: ExtendedRouteObject[] = []
        // should omit layout, because layout is already handled
        dfsRoutes(parentKey, childrenChildren, omit(paths, "layout") as NestedStructure, parentPath)
        children.push({
          path: "",
          lazy: globGetter,
          children: childrenChildren,
          handle: {
            fs: segmentPathKey,
            fullPath: parentPath,
            isSync,
          },
        })
        break
      } else {
        const content = paths[key]!
        const hasChild = Object.keys(content).length > 0

        const normalizeKey = normalizePathKey(key)

        if (!hasChild) {
          // Check for both sync and async files
          const syncPath = `${segmentPathKey}.sync.tsx`
          const asyncPath = `${segmentPathKey}.tsx`

          let accessPath: string
          let isSync = false
          const syncGlobGetter = get(glob, syncPath)
          let globGetter

          if (syncGlobGetter) {
            accessPath = syncPath
            isSync = true
            globGetter = syncGlobGetter
          } else {
            accessPath = asyncPath
            globGetter = get(glob, asyncPath)
          }

          if (pathGetterSet.has(accessPath)) {
            console.error(`duplicate path: ${accessPath}`)
          }
          pathGetterSet.add(accessPath)

          children.push({
            path: normalizeKey,
            lazy: globGetter,
            handle: {
              fs: `${segmentPathKey}/${normalizeKey}`,
              fullPath: `${parentPath}/${normalizeKey}`,
              isSync,
            },
          })
        } else {
          const childrenChildren: ExtendedRouteObject[] = []
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
