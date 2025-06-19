const { withAndroidManifest } = require("expo/config-plugins")

// Ported from https://github.com/bluesky-social/social-app/blob/a5e25a7a16cdcde64628e942c073a119bc1d7a1e/plugins/withAndroidManifestPlugin.js
module.exports = function withAndroidManifestPlugin(appConfig) {
  return withAndroidManifest(appConfig, (decoratedAppConfig) => {
    try {
      decoratedAppConfig.modResults.manifest.application[0].$["android:largeHeap"] = "true"
    } catch (e) {
      console.error(`withAndroidManifestPlugin failed`, e)
    }
    return decoratedAppConfig
  })
}
