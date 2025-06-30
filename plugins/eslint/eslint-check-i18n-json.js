// @ts-check
/** @type {import("eslint").ESLint.Plugin} */
import fs from "node:fs"

import path from "pathe"

import { cleanJsonText } from "../utils.js"

export default {
  rules: {
    "valid-i18n-keys": {
      meta: {
        type: "problem",
        docs: {
          description: "Ensure i18n JSON keys are flat and valid as object paths",
          category: "Possible Errors",
          recommended: true,
        },
        fixable: null,
      },
      create(context) {
        return {
          Program(node) {
            const { filename, sourceCode } = context

            if (!filename.endsWith(".json")) return

            let json
            try {
              json = JSON.parse(cleanJsonText(sourceCode.text))
            } catch {
              context.report({
                node,
                message: "Invalid JSON format",
              })
              return
            }

            const keys = Object.keys(json)
            const keyPrefixes = new Set()

            for (const key of keys) {
              if (key.includes(".")) {
                const parts = key.split(".")
                for (let i = 1; i < parts.length; i++) {
                  const prefix = parts.slice(0, i).join(".")
                  if (keys.includes(prefix)) {
                    context.report({
                      node,
                      message: `Invalid key structure: '${key}' conflicts with '${prefix}'`,
                    })
                  }
                  keyPrefixes.add(prefix)
                }
              }
            }

            for (const key of keys) {
              if (keyPrefixes.has(key)) {
                context.report({
                  node,
                  message: `Invalid key structure: '${key}' is a prefix of another key`,
                })
              }
            }
          },
        }
      },
    },
    "no-extra-keys": {
      meta: {
        type: "problem",
        docs: {
          description: "Ensure non-English JSON files don't have extra keys not present in en.json",
          category: "Possible Errors",
          recommended: true,
        },
        fixable: "code", // Set fixable to "code"
      },
      create(context) {
        return {
          Program(node) {
            const { filename, sourceCode } = context

            if (!filename.endsWith(".json")) return

            const parts = filename.split(path.sep)
            const lang = parts.at(-1).split(".")[0]
            const namespace = parts.at(-2)

            if (lang === "en") return

            let currentJson = {}
            let englishJson = {}

            try {
              currentJson = JSON.parse(sourceCode.text)
              const englishFilePath = path.join(path.dirname(filename), "../", namespace, "en.json")
              englishJson = JSON.parse(fs.readFileSync(englishFilePath, "utf8"))
            } catch (error) {
              context.report({
                node,
                message: `Error parsing JSON: ${error.message}`,
              })
              return
            }

            const extraKeys = Object.keys(currentJson).filter(
              (key) => !Object.prototype.hasOwnProperty.call(englishJson, key),
            )

            for (const key of extraKeys) {
              context.report({
                node,
                message: `Key "${key}" is present in ${lang}.json but not in en.json for namespace "${namespace}"`,
                fix(fixer) {
                  const newJson = Object.fromEntries(
                    Object.entries(currentJson).filter(([k]) => !extraKeys.includes(k)),
                  )

                  const newText = `${JSON.stringify(newJson, null, 2)}\n`

                  return fixer.replaceText(node, newText)
                },
              })
            }
          },
        }
      },
    },
  },
}
