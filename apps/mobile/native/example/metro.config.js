const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")
const path = require("pathe")
const { wrapWithReanimatedMetroConfig } = require("react-native-reanimated/metro-config")

const config = getDefaultConfig(__dirname, { isCSSEnabled: true })

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
})

config.resolver.nodeModulesPaths = [path.resolve(__dirname, "./node_modules")]

config.watchFolders = [path.resolve(__dirname, "./node_modules"), path.resolve(__dirname, "./src")]

module.exports = wrapWithReanimatedMetroConfig(withNativeWind(config, { input: "./global.css" }))
