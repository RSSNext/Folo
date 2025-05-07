// @ts-check
import fs from "node:fs"
import path from "node:path"
import process from "node:process"

import fg from "fast-glob"

const dependencyKeys = ["dependencies", "devDependencies"]

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
          if (filePath === path.relative(cwd, context.filename)) return

          const packageJson = JSON.parse(fs.readFileSync(filePath, "utf-8"))

          dependencyKeys.forEach((key) => {
            const dependencies = packageJson[key]
            if (!dependencies) return

            Object.keys(dependencies).forEach((dependency) => {
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
