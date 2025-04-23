const { withGradleProperties } = require("expo/config-plugins")

// Fix android build failed randomly
// Ported from https://github.com/bluesky-social/social-app/blob/main/plugins/withGradleJVMHeapSizeIncrease.js
// Licensed under the MIT License
// See also https://github.com/expo/expo/issues/30413

function setGradlePropertiesValue(config, key, value) {
  return withGradleProperties(config, (exportedConfig) => {
    const keyIdx = exportedConfig.modResults.findIndex(
      (item) => item.type === "property" && item.key === key,
    )
    if (keyIdx !== -1) {
      exportedConfig.modResults.splice(keyIdx, 1, {
        type: "property",
        key,
        value,
      })
    } else {
      exportedConfig.modResults.push({
        type: "property",
        key,
        value,
      })
    }

    return exportedConfig
  })
}

module.exports = function withGradleJVMHeapSizeIncrease(config) {
  const newConfig = setGradlePropertiesValue(
    config,
    "org.gradle.jvmargs",
    "-Xmx4096m -XX:MaxMetaspaceSize=1024m", //Set data of your choice
  )

  return newConfig
}
