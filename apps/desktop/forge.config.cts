import "dotenv/config"

import crypto from "node:crypto"
import fs, { readdirSync } from "node:fs"
import { cp, readdir } from "node:fs/promises"
import path, { resolve } from "node:path"

import { FuseV1Options, FuseVersion } from "@electron/fuses"
import { MakerAppX } from "@electron-forge/maker-appx"
import { MakerDMG } from "@electron-forge/maker-dmg"
import { MakerPKG } from "@electron-forge/maker-pkg"
import { MakerSquirrel } from "@electron-forge/maker-squirrel"
import { MakerZIP } from "@electron-forge/maker-zip"
import { FusesPlugin } from "@electron-forge/plugin-fuses"
import type { ForgeConfig } from "@electron-forge/shared-types"
import MakerAppImage from "@pengx17/electron-forge-maker-appimage"
import setLanguages from "electron-packager-languages"
import yaml from "js-yaml"
import { rimraf, rimrafSync } from "rimraf"

const platform = process.argv.find((arg) => arg.startsWith("--platform"))?.split("=")[1]
const mode = process.argv.find((arg) => arg.startsWith("--mode"))?.split("=")[1]

const isStaging = mode === "staging"

const artifactRegex = /.*\.(?:exe|dmg|AppImage|zip)$/
const platformNamesMap = {
  darwin: "macos",
  linux: "linux",
  win32: "windows",
}
const ymlMapsMap = {
  darwin: "latest-mac.yml",
  linux: "latest-linux.yml",
  win32: "latest.yml",
}

const keepModules = new Set(["font-list", "vscode-languagedetection"])
const keepLanguages = new Set(["en", "en_GB", "en-US", "en_US"])

// remove folders & files not to be included in the app
async function cleanSources(buildPath, _electronVersion, platform, _arch, callback) {
  // folders & files to be included in the app
  const appItems = new Set(["dist", "node_modules", "package.json", "resources"])

  if (platform === "darwin" || platform === "mas") {
    const frameworkResourcePath = resolve(
      buildPath,
      "../../Frameworks/Electron Framework.framework/Versions/A/Resources",
    )

    for (const file of readdirSync(frameworkResourcePath)) {
      if (file.endsWith(".lproj") && !keepLanguages.has(file.split(".")[0]!)) {
        rimrafSync(resolve(frameworkResourcePath, file))
      }
    }
  }

  // Keep only node_modules to be included in the app

  await Promise.all([
    ...(await readdir(buildPath).then((items) =>
      items.filter((item) => !appItems.has(item)).map((item) => rimraf(path.join(buildPath, item))),
    )),
    ...(await readdir(path.join(buildPath, "node_modules")).then((items) =>
      items
        .filter((item) => !keepModules.has(item))
        .map((item) => rimraf(path.join(buildPath, "node_modules", item))),
    )),
  ])

  // copy needed node_modules to be included in the app
  await Promise.all(
    Array.from(keepModules.values()).map((item) => {
      // Check is exist
      if (fs.existsSync(path.join(buildPath, "node_modules", item))) {
        // eslint-disable-next-line array-callback-return
        return
      }
      return cp(
        path.join(process.cwd(), "../../node_modules", item),
        path.join(buildPath, "node_modules", item),
        {
          recursive: true,
        },
      )
    }),
  )

  callback()
}

const noopAfterCopy = (_buildPath, _electronVersion, _platform, _arch, callback) => callback()

const ignorePattern = new RegExp(`^/node_modules/(?!${[...keepModules].join("|")})`)

const config: ForgeConfig = {
  packagerConfig: {
    name: isStaging ? "Folo Staging" : "Folo",
    appCategoryType: "public.app-category.news",
    buildVersion: process.env.BUILD_VERSION || undefined,
    appBundleId: "is.follow",
    icon: isStaging ? "resources/icon-staging" : "resources/icon",
    extraResource: ["./resources/app-update.yml"],
    protocols: [
      {
        name: "Folo",
        schemes: ["follow"],
      },
      {
        name: "Folo",
        schemes: ["folo"],
      },
    ],

    afterCopy: [
      cleanSources,
      process.platform !== "win32" ? noopAfterCopy : setLanguages([...keepLanguages.values()]),
    ],
    asar: true,
    ignore: [ignorePattern],

    prune: true,
    extendInfo: {
      ITSAppUsesNonExemptEncryption: false,
    },
    osxSign: {
      optionsForFile:
        platform === "mas"
          ? (filePath) => {
              const entitlements = filePath.includes(".app/")
                ? "build/entitlements.mas.child.plist"
                : "build/entitlements.mas.plist"
              return {
                hardenedRuntime: false,
                entitlements,
              }
            }
          : () => ({
              entitlements: "build/entitlements.mac.plist",
            }),
      keychain: process.env.OSX_SIGN_KEYCHAIN_PATH,
      identity: process.env.OSX_SIGN_IDENTITY,
      provisioningProfile: process.env.OSX_SIGN_PROVISIONING_PROFILE_PATH,
    },
    ...(process.env.APPLE_ID &&
      process.env.APPLE_PASSWORD &&
      process.env.APPLE_TEAM_ID && {
        osxNotarize: {
          appleId: process.env.APPLE_ID!,
          appleIdPassword: process.env.APPLE_PASSWORD!,
          teamId: process.env.APPLE_TEAM_ID!,
        },
      }),
  },
  rebuildConfig: {},
  makers: [
    new MakerZIP({}, ["darwin"]),
    new MakerDMG(
      {
        overwrite: true,
        background: "static/dmg-background.png",
        icon: "static/dmg-icon.icns",
        iconSize: 160,
        additionalDMGOptions: {
          window: {
            size: {
              width: 660,
              height: 400,
            },
          },
        },
        contents: (opts) => [
          {
            x: 180,
            y: 170,
            type: "file",
            path: (opts as any).appPath,
          },
          {
            x: 480,
            y: 170,
            type: "link",
            path: "/Applications",
          },
        ],
      },
      ["darwin", "mas"],
    ),
    new MakerSquirrel({
      name: "Folo",
      setupIcon: isStaging ? "resources/icon-staging.ico" : "resources/icon.ico",
      iconUrl: "https://app.follow.is/favicon.ico",
    }),
    new MakerAppImage({
      config: {
        icons: [
          {
            file: isStaging ? "resources/icon-staging.png" : "resources/icon.png",
            size: 256,
          },
        ],
      },
    }),
    new MakerPKG(
      {
        name: "Folo",
        keychain: process.env.KEYCHAIN_PATH,
      },
      ["mas"],
    ),
    new MakerAppX({
      publisher: "CN=7CBBEB6A-9B0E-4387-BAE3-576D0ACA279E",
      packageDisplayName: "Folo - Follow everything in one place",
      devCert: "build/dev.pfx",
      assets: "static/appx",
      // @ts-ignore
      publisherDisplayName: "Natural Selection Labs",
      identityName: "NaturalSelectionLabs.Follow-Yourfavoritesinoneinbo",
      packageBackgroundColor: "#FF5C00",
      protocol: "follow", // TODO: use custom appx manifest to support both follow and folo
    }),
  ],
  plugins: [
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  publishers: [
    {
      name: "@electron-forge/publisher-github",
      config: {
        repository: {
          owner: "RSSNext",
          name: "follow",
        },
        draft: true,
      },
    },
  ],
  hooks: {
    postMake: async (_config, makeResults) => {
      const yml: {
        version?: string
        files: {
          url: string
          sha512: string
          size: number
        }[]
        releaseDate?: string
      } = {
        version: makeResults[0]?.packageJSON?.version,
        files: [],
      }
      let basePath = ""
      makeResults = makeResults.map((result) => {
        result.artifacts = result.artifacts.map((artifact) => {
          if (artifactRegex.test(artifact)) {
            if (!basePath) {
              basePath = path.dirname(artifact)
            }
            const newArtifact = `${path.dirname(artifact)}/${
              result.packageJSON.productName
            }-${result.packageJSON.version}-${
              platformNamesMap[result.platform]
            }-${result.arch}${path.extname(artifact)}`
            fs.renameSync(artifact, newArtifact)

            try {
              const fileData = fs.readFileSync(newArtifact)
              const hash = crypto.createHash("sha512").update(fileData).digest("base64")
              const { size } = fs.statSync(newArtifact)

              yml.files.push({
                url: path.basename(newArtifact),
                sha512: hash,
                size,
              })
            } catch {
              console.error(`Failed to hash ${newArtifact}`)
            }
            return newArtifact
          } else {
            return artifact
          }
        })
        return result
      })
      yml.releaseDate = new Date().toISOString()

      if (makeResults[0]?.platform && ymlMapsMap[makeResults[0].platform] && basePath) {
        const ymlPath = path.join(basePath, ymlMapsMap[makeResults[0].platform])

        const ymlStr = yaml.dump(yml, {
          lineWidth: -1,
        })
        fs.writeFileSync(ymlPath, ymlStr)

        makeResults.push({
          artifacts: [ymlPath],
          platform: makeResults[0]!.platform,
          arch: makeResults[0]!.arch,
          packageJSON: makeResults[0]!.packageJSON,
        })
      }

      return makeResults
    },
  },
}

export default config
