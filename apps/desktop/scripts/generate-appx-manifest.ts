#!/usr/bin/env tsx

import fs from "node:fs"

import path from "pathe"

interface AppXManifestConfig {
  packageName: string
  packageDisplayName: string
  publisherDisplayName: string
  identityName: string
  version: string
  publisher: string
  packageBackgroundColor: string
  protocols: string[]
  description: string
  appBundleId: string
}

function generateAppXManifest(config: AppXManifestConfig, templatePath: string): string {
  // Read template file
  const template = fs.readFileSync(templatePath, "utf-8")

  // Generate protocol extensions
  const protocolExtensions = config.protocols
    .map(
      (protocol) => `
        <uap:Extension Category="windows.protocol">
          <uap:Protocol Name="${protocol}" />
        </uap:Extension>`,
    )
    .join("")

  // Replace template variables
  const manifest = template
    .replaceAll("{identityName}", config.identityName)
    .replaceAll("{publisherName}", config.publisher)
    .replaceAll("{packageVersion}", config.version)
    .replaceAll("{packageDisplayName}", config.packageDisplayName)
    .replaceAll("{publisherDisplayName}", config.publisherDisplayName)
    .replaceAll("{packageName}", config.packageName)
    .replaceAll("{packageExecutable}", `app\\${config.packageName}.exe`)
    .replaceAll("{packageBackgroundColor}", config.packageBackgroundColor)
    .replaceAll("{packageDescription}", config.description)
    .replaceAll("{protocol}", protocolExtensions)

  return manifest
}

async function main() {
  try {
    // Read package.json to get app information
    const packageJsonPath = path.resolve(process.cwd(), "package.json")
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

    // Get mode from command line arguments
    const mode = process.argv.find((arg) => arg.startsWith("--mode"))?.split("=")[1]
    const isStaging = mode === "staging"

    // Parse version for AppX format (must be x.x.x.x)
    const { version } = packageJson
    const versionParts = version.split(".")
    // Ensure we have 4 parts for AppX version format
    while (versionParts.length < 4) {
      versionParts.push("0")
    }
    const appxVersion = versionParts.slice(0, 4).join(".")

    const config: AppXManifestConfig = {
      packageName: "Folo",
      packageDisplayName: isStaging
        ? "Folo Staging - Follow everything in one place"
        : "Folo - Follow everything in one place",
      publisherDisplayName: "Natural Selection Labs",
      identityName: "NaturalSelectionLabs.Follow-Yourfavoritesinoneinbo",
      version: appxVersion,
      publisher: "CN=7CBBEB6A-9B0E-4387-BAE3-576D0ACA279E",
      packageBackgroundColor: "#FF5C00",
      protocols: ["folo", "follow"],
      description: "Follow everything in one place.",
      appBundleId: "is.follow",
    }

    // Template file path
    const templatePath = path.resolve(process.cwd(), "build/appxmanifest-template.xml")

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }

    const manifest = generateAppXManifest(config, templatePath)

    // Ensure output directory exists
    const outputDir = path.resolve(process.cwd(), "build")
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    // Write manifest file
    const outputPath = path.resolve(outputDir, "appxmanifest.xml")
    fs.writeFileSync(outputPath, manifest, "utf-8")
  } catch (error) {
    console.error("❌ Failed to generate AppX manifest:", error)
    process.exit(1)
  }
}

main()

export { type AppXManifestConfig, generateAppXManifest }
