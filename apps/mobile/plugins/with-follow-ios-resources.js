const { withDangerousMod, withXcodeProject, IOSConfig } = require("expo/config-plugins")
const fs = require("node:fs")
const path = require("pathe")

const IOS_RESOURCES = [
  {
    source: path.resolve(__dirname, "..", "assets", "ios-native", "Assets.xcassets"),
    destination: "Assets.xcassets",
  },
  {
    source: path.resolve(
      __dirname,
      "..",
      "assets",
      "ios-native",
      "Folo - Follow everything.storekit",
    ),
    destination: "Folo - Follow everything.storekit",
  },
]

function assertResourceExists(resource) {
  if (!fs.existsSync(resource.source)) {
    throw new Error(`Missing iOS resource source: ${resource.source}`)
  }
}

function copyIOSResources(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const { platformProjectRoot } = config.modRequest

      for (const resource of IOS_RESOURCES) {
        assertResourceExists(resource)

        const target = path.join(platformProjectRoot, resource.destination)
        fs.rmSync(target, { force: true, recursive: true })
        fs.cpSync(resource.source, target, { recursive: true })
      }

      return config
    },
  ])
}

function withFollowIOSResources(config) {
  const copiedConfig = copyIOSResources(config)

  return withXcodeProject(copiedConfig, (config) => {
    const project = config.modResults
    const groupName = config.modRequest.projectName

    for (const resource of IOS_RESOURCES) {
      IOSConfig.XcodeUtils.addResourceFileToGroup({
        filepath: resource.destination,
        groupName,
        isBuildFile: true,
        project,
        verbose: true,
      })
    }

    return config
  })
}

module.exports = withFollowIOSResources
