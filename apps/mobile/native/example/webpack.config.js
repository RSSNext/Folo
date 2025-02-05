const createConfigAsync = require("@expo/webpack-config")
const path = require("node:path")

module.exports = async (env, argv) => {
  const config = await createConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: ["follow-native"],
      },
    },
    argv,
  )
  config.resolve.modules = [
    path.resolve(__dirname, "./node_modules"),
    path.resolve(__dirname, "../node_modules"),
  ]

  return config
}
