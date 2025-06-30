import { execSync } from "node:child_process"
import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { intro, outro, select } from "@clack/prompts"
import path, { dirname } from "pathe"
import color from "picocolors"
import * as ts from "typescript"

const locales = [
  "af",
  "am",
  "ar-DZ",
  "ar-IQ",
  "ar-KW",
  "ar-LY",
  "ar-MA",
  "ar-SA",
  "ar-TN",

  "az",
  "be",
  "bg",
  "bi",
  "bm",
  "bn-BD",
  "bn",
  "bo",
  "br",

  "bs",
  "ca",
  "cs",
  "cv",
  "cy",
  "da-AT",
  "da-CH",
  "da",
  "dv",

  "el",
  "en-AU",
  "en-CA",
  "en-GB",
  "en-IE",
  "en-IL",
  "en-IN",
  "en-NZ",
  "en-SG",
  "en-TT",

  "eo",
  "es-DO",
  "es-MX",
  "es-PR",
  "es-US",
  "es",
  "et",
  "eu",

  "fa",
  "fi",
  "fo",
  "fr-CA",
  "fr-CH",
  "fr",
  "fy",
  "ga",

  "gd",
  "gl",
  "gom-LATN",
  "gu",
  "he",
  "hi",
  "hr",
  "ht",

  "hu",
  "hy-AM",
  "id",
  "is",
  "it-CH",
  "it",
  "ja",
  "jv",

  "ka",
  "kk",
  "km",
  "kn",
  "ko",
  "ku",
  "ky",
  "lb",

  "lo",
  "lt",
  "lv",
  "me",
  "mi",
  "mk",
  "ml",
  "mn",

  "mr",
  "ms-MY",
  "ms",
  "mt",
  "my",
  "nb",
  "ne",
  "nl-BE",
  "nl",

  "oc-LNC",
  "pa-IN",
  "pl",
  "pt-BR",
  "pt",
  "rn",
  "ro",
  "ru",
  "sd",
  "se",
  "si",
  "sk",
  "sl",
  "sq",
  "sr-CYRL",
  "sr",
  "ss",

  "sv-FI",
  "sv",
  "sw",
  "ta",
  "te",
  "tet",
  "tg",
  "th",
  "tk",
  "tl-PH",
  "tlh",
  "tr",
  "tzl",
  "tzm-LATN",
  "tzm",
  "ug-CN",
  "uk",

  "ur",
  "uz-LATN",
  "uz",
  "vi",
  "x-PSEUDO",
  "yo",
  "zh-CN",
  "zh-HK",
  "zh-TW",
  "zh",
]

async function selectLocale(): Promise<string> {
  intro(color.blue("Locale Selection"))

  const selectedLocale = await select({
    message: "Select a locale:",
    options: locales.map((locale) => ({ value: locale, label: locale })),
    maxItems: 10,
  })

  if (typeof selectedLocale !== "string") {
    throw new TypeError("No locale selected")
  }

  return selectedLocale
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALE_DIR = path.resolve(__dirname, "../locales")
const CONFIG_DIR = path.resolve(__dirname, "../apps/desktop/src/renderer/src/@types")

async function main() {
  const selectedLocale = await selectLocale()
  outro(`You selected: ${color.green(selectedLocale)}`)

  const readdirLocales = readdirSync(LOCALE_DIR)
  for (const ns of readdirLocales) {
    const isExistResource = readdirSync(path.resolve(LOCALE_DIR, ns)).includes(
      `${selectedLocale}.json`,
    )
    if (!isExistResource) {
      // Create new resource file, write a empty json
      writeFileSync(path.resolve(LOCALE_DIR, ns, `${selectedLocale}.json`), "{}")
    }
  }

  // Update config file
  const defaultResourceFilePath = path.resolve(CONFIG_DIR, "default-resource.ts")
  const defaultResourceFileContent = readFileSync(defaultResourceFilePath, "utf8")

  const sourceFile = ts.createSourceFile(
    defaultResourceFilePath,
    defaultResourceFileContent,
    ts.ScriptTarget.Latest,
    true,
  )

  const updatedContent = updateDefaultResourceFile(sourceFile, selectedLocale)
  if (updatedContent !== defaultResourceFileContent) {
    writeFileSync(defaultResourceFilePath, updatedContent)
    console.info(`Updated ${defaultResourceFilePath} with new locale: ${selectedLocale}`)
  } else {
    console.info(`Locale ${selectedLocale} already exists in default-resource.ts`)
  }

  // Update constants file
  const constantsFilePath = path.resolve(CONFIG_DIR, "constants.ts")
  const constantsFileContent = readFileSync(constantsFilePath, "utf8")

  const constantsSourceFile = ts.createSourceFile(
    constantsFilePath,
    constantsFileContent,
    ts.ScriptTarget.Latest,
    true,
  )

  const updatedConstantsContent = updateConstantsFile(constantsSourceFile, selectedLocale)
  if (updatedConstantsContent !== constantsFileContent) {
    writeFileSync(constantsFilePath, updatedConstantsContent)
    console.info(`Updated ${constantsFilePath} with new locale: ${selectedLocale}`)
  } else {
    console.info(`Locale ${selectedLocale} already exists in constants.ts`)
  }

  // format these files
  execSync(`npx prettier --write ${defaultResourceFilePath} ${constantsFilePath}`)

  console.info("Done!")
  console.info("Please open your editor and fill in the missing translations.")
  console.info(`Resources: ${color.green("locales/")}${color.green(selectedLocale)}`)
}

function updateDefaultResourceFile(sourceFile: ts.SourceFile, locale: string): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const result = ts.transform(sourceFile, [
    (context) => (rootNode) => {
      let importsAdded = false

      function visit(node: ts.Node): ts.Node {
        if (ts.isImportDeclaration(node) && !importsAdded) {
          const newImports = [
            createImportDeclaration(
              `lang_${locale.replace("-", "")}`,
              `@locales/lang/${locale}.json`,
            ),
            createImportDeclaration(
              `common_${locale.replace("-", "")}`,
              `@locales/common/${locale}.json`,
            ),
          ]
          importsAdded = true
          return [node, ...newImports] as unknown as ts.Node
        }

        if (
          ts.isVariableDeclaration(node) &&
          ts.isIdentifier(node.name) &&
          node.name.text === "defaultResources" &&
          node.initializer &&
          ts.isObjectLiteralExpression(node.initializer)
        ) {
          const existingLocale = node.initializer.properties.find(
            (prop) => ts.isPropertyAssignment(prop) && prop.name.getText() === `"${locale}"`,
          )

          if (existingLocale) {
            return node
          }

          const newProperties = [
            ...node.initializer.properties,
            ts.factory.createPropertyAssignment(
              ts.factory.createStringLiteral(locale),
              ts.factory.createObjectLiteralExpression([
                ts.factory.createPropertyAssignment(
                  "lang",
                  ts.factory.createIdentifier(`lang_${locale.replace("-", "")}`),
                ),
                ts.factory.createPropertyAssignment(
                  "common",
                  ts.factory.createIdentifier(`common_${locale.replace("-", "")}`),
                ),
              ]),
            ),
          ]

          return ts.factory.updateVariableDeclaration(
            node,
            node.name,
            node.exclamationToken,
            node.type,
            ts.factory.createObjectLiteralExpression(newProperties, true),
          )
        }
        return ts.visitEachChild(node, visit, context)
      }

      return ts.visitNode(rootNode, visit) as ts.SourceFile
    },
  ])

  return printer.printFile(result.transformed[0] as ts.SourceFile)
}

function createImportDeclaration(identifier: string, path: string): ts.ImportDeclaration {
  return ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(false, ts.factory.createIdentifier(identifier), void 0),
    ts.factory.createStringLiteral(path),
  )
}

function updateConstantsFile(sourceFile: ts.SourceFile, locale: string): string {
  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
  const result = ts.transform(sourceFile, [
    (context) => (rootNode) => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) {
          if (node.name.text === "currentSupportedLanguages") {
            return updateLangsArray(node, locale)
          }
          if (node.name.text === "dayjsLocaleImportMap") {
            return updateDayjsLocaleImportMap(node, locale)
          }
        }
        return ts.visitEachChild(node, visit, context)
      }
      return ts.visitNode(rootNode, visit) as ts.SourceFile
    },
  ])

  return printer.printFile(result.transformed[0] as ts.SourceFile)
}

function updateLangsArray(node: ts.VariableDeclaration, locale: string): ts.VariableDeclaration {
  if (node.initializer && ts.isArrayLiteralExpression(node.initializer)) {
    const existingElements = node.initializer.elements
    if (!existingElements.some((el) => ts.isStringLiteral(el) && el.text === locale)) {
      const newElements = [...existingElements, ts.factory.createStringLiteral(locale)]
      const newInitializer = ts.factory.createArrayLiteralExpression(newElements, true)
      return ts.factory.updateVariableDeclaration(
        node,
        node.name,
        node.exclamationToken,
        node.type,
        newInitializer,
      )
    }
  }
  return node
}

function updateDayjsLocaleImportMap(
  node: ts.VariableDeclaration,
  locale: string,
): ts.VariableDeclaration {
  if (node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
    const existingProperties = node.initializer.properties
    if (
      !existingProperties.some(
        (prop) => ts.isPropertyAssignment(prop) && prop.name.getText() === `["${locale}"]`,
      )
    ) {
      const newProperty = ts.factory.createPropertyAssignment(
        ts.factory.createComputedPropertyName(ts.factory.createStringLiteral(locale)),
        ts.factory.createArrayLiteralExpression([
          ts.factory.createStringLiteral(locale.toLowerCase()),
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            ts.factory.createCallExpression(ts.factory.createIdentifier("import"), undefined, [
              ts.factory.createStringLiteral(`dayjs/locale/${locale.toLowerCase()}`),
            ]),
          ),
        ]),
      )
      const newProperties = [...existingProperties, newProperty]
      return ts.factory.updateVariableDeclaration(
        node,
        node.name,
        node.exclamationToken,
        node.type,
        ts.factory.createObjectLiteralExpression(newProperties, true),
      )
    }
  }
  return node
}

main().catch(console.error)
