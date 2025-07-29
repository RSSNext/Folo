const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("pathe")
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config")

const config = getDefaultConfig(__dirname, { isCSSEnabled: true })
config.resolver.sourceExts.push("sql")

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
})

config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "./node_modules"),
  path.resolve(__dirname, "../../node_modules"),
]

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@locales": path.resolve(__dirname, "../../locales"),
}

config.watchFolders = [...config.watchFolders, path.resolve(__dirname, "../../locales")]

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const result = context.resolveRequest(context, moduleName, platform)
  if (result.type === "sourceFile") {
    const lastDotIndex = result.filePath.lastIndexOf(".")
    const mobilePath = `${result.filePath.slice(0, lastDotIndex)}.rn${result.filePath.slice(lastDotIndex)}`
    const file = context.fileSystemLookup(mobilePath)
    if (file.exists) {
      return {
        ...result,
        filePath: mobilePath,
      }
    } else {
      return result
    }
  }
  return result
}

module.exports = wrapWithReanimatedMetroConfig(
  withNativeWind(config, { input: "./src/global.css" }),
)
