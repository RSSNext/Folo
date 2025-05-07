// Ported from https://github.com/bluesky-social/social-app/blob/a770f5635b549f2a87ffeaedd031dfe8e37b58c8/plugins/withAndroidDayNightThemePlugin.js
// Licensed under the MIT License

// Based on https://github.com/expo/expo/pull/33957
// Could be removed once the app has been updated to Expo 53
const { withAndroidStyles } = require("@expo/config-plugins")

module.exports = function withAndroidDayNightThemePlugin(appConfig) {
  const cleanupList = new Set([
    "colorPrimary",
    "android:editTextBackground",
    "android:textColor",
    "android:editTextStyle",
  ])

  return withAndroidStyles(appConfig, (config) => {
    config.modResults.resources.style = config.modResults.resources.style
      ?.map((style) => {
        if (style.$.name === "AppTheme" && style.item != null) {
          style.item = style.item.filter((item) => !cleanupList.has(item.$.name))
        }
        return style
      })
      .filter((style) => {
        return style.$.name !== "ResetEditText"
      })

    return config
  })
}
