// @ts-check
import fs from "node:fs"
import process from "node:process"

import fg from "fast-glob"
import path from "pathe"

const dependencyKeys = ["dependencies", "devDependencies"]
const ignoredEnsureVersionFiles = new Set(["apps/landing/package.json"])
const ignoredEnsureVersionDependencies = new Map([
  // electron-vite 5 still peers Vite 5/6/7, so the root desktop toolchain
  // stays on Vite 7 while Vite-native apps can move to Vite 8.
  ["package.json", new Set(["vite"])],
  ["apps/ssr/package.json", new Set(["@vitejs/plugin-react", "vite"])],
  ["apps/mobile/web-app/html-renderer/package.json", new Set(["@vitejs/plugin-react"])],
  // NativeWind 4 uses react-native-css-interop, whose latest stable release
  // still requires Tailwind CSS 3.
  ["apps/mobile/package.json", new Set(["tailwindcss"])],
])

const isIgnoredEnsureVersionDependency = (filePath, dependency) =>
  ignoredEnsureVersionDependencies.get(filePath)?.has(dependency) ?? false

/** @type {import("eslint").ESLint.Plugin} */
export default {
  rules: {
    "ensure-package-version": {
      meta: {
        type: "problem",
        docs: {
          description: "Ensure that the versions of packages in the workspace are consistent",
          category: "Possible Errors",
          recommended: true,
        },
        fixable: "code",
        hasSuggestions: true,
      },
      create(context) {
        if (!context.filename.endsWith("package.json")) return {}

        const cwd = process.cwd()
        const currentFilePath = path.relative(cwd, context.filename).replaceAll("\\", "/")
        if (ignoredEnsureVersionFiles.has(currentFilePath)) return {}

        const packageJsonFilePaths = fg.globSync(
          ["packages/*/package.json", "apps/*/package.json", "package.json"],
          {
            cwd,
            ignore: ["**/node_modules/**"],
          },
        )

        /** @type {Map<string, { version: string, filePath: string }[]>} */
        const packageVersionMap = new Map()

        packageJsonFilePaths.forEach((filePath) => {
          if (ignoredEnsureVersionFiles.has(filePath)) return
          if (filePath === path.relative(cwd, context.filename)) return

          const packageJson = JSON.parse(fs.readFileSync(filePath, "utf-8"))

          dependencyKeys.forEach((key) => {
            const dependencies = packageJson[key]
            if (!dependencies) return

            Object.keys(dependencies).forEach((dependency) => {
              if (isIgnoredEnsureVersionDependency(filePath, dependency)) return

              if (!packageVersionMap.has(dependency)) {
                packageVersionMap.set(dependency, [])
              }
              packageVersionMap.get(dependency)?.push({
                version: dependencies[dependency],
                filePath,
              })
            })
          })
        })

        return {
          "Program > JSONExpressionStatement > JSONObjectExpression > JSONProperty > JSONObjectExpression > JSONProperty"(
            node,
          ) {
            const parent = node?.parent?.parent
            if (!parent) return
            const packageCategory = parent.key.value
            if (!dependencyKeys.includes(packageCategory)) return
            const packageName = node.key.value
            const packageVersion = node.value.value
            if (isIgnoredEnsureVersionDependency(currentFilePath, packageName)) return

            const versions = packageVersionMap.get(packageName)
            if (!versions || versions.find((v) => v.version === packageVersion)) return

            context.report({
              node,
              message: `Inconsistent versions of ${packageName}: ${Array.from(new Set(versions.map((v) => v.version))).join(", ")}`,
              suggest: versions.map((version) => ({
                desc: `Follow the version ${version.version} in ${version.filePath}`,
                fix: (fixer) => fixer.replaceText(node.value, `"${version.version}"`),
              })),
            })
          },
        }
      },
    },
    "no-duplicate-package": {
      meta: {
        type: "problem",
        docs: {
          description: "Ensure packages are not duplicated in one package.json",
          category: "Possible Errors",
          recommended: true,
        },
      },
      create(context) {
        if (!context.filename.endsWith("package.json")) return {}

        let json
        try {
          json = JSON.parse(fs.readFileSync(context.filename, "utf-8"))
        } catch {
          return {}
        }

        const dependencyMap = new Map()
        dependencyKeys.forEach((key) => {
          const dependencies = json[key]
          if (!dependencies) return

          if (!dependencyMap.get(key)) {
            dependencyMap.set(key, new Set())
          }

          const dependencySet = dependencyMap.get(key)
          Object.keys(dependencies).forEach((dependency) => {
            dependencySet.add(dependency)
          })
        })

        return {
          "Program > JSONExpressionStatement > JSONObjectExpression > JSONProperty > JSONObjectExpression > JSONProperty"(
            node,
          ) {
            const parent = node?.parent?.parent
            if (!parent) return
            const packageCategory = parent.key.value
            if (!dependencyKeys.includes(packageCategory)) return
            const packageName = node.key.value

            dependencyKeys.forEach((key) => {
              if (key === packageCategory) return
              if (!dependencyMap.get(key)?.has(packageName)) return

              context.report({
                node,
                message: `Duplicated package ${packageName} in ${key}`,
              })
            })
          },
        }
      },
    },
  },
}
