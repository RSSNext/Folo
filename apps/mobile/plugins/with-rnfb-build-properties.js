const { withPodfile, withPodfileProperties } = require("@expo/config-plugins")
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode")

const STATIC_FRAMEWORK_TAG = "follow-rnfb-static-framework"
const RNFB_IOS_COMPAT_TAG = "follow-rnfb-ios-compat"
const RNFB_STATIC_PODS = ["RNFBApp", "RNFBAnalytics", "RNFBMessaging", "RNFBAppCheck"]

module.exports = function withRNFBBuildProperties(config) {
  config = withPodfileProperties(config, (config) => {
    config.modResults["ios.useFrameworks"] = "static"
    config.modResults["ios.forceStaticLinking"] = JSON.stringify(RNFB_STATIC_PODS)
    return config
  })

  config = withPodfile(config, (config) => {
    config.modResults.contents = mergeContents({
      tag: STATIC_FRAMEWORK_TAG,
      src: config.modResults.contents,
      newSrc: "$RNFirebaseAsStaticFramework = true",
      anchor: /podfile_properties = JSON\.parse/,
      offset: 1,
      comment: "#",
    }).contents

    config.modResults.contents = mergeContents({
      tag: RNFB_IOS_COMPAT_TAG,
      src: config.modResults.contents,
      newSrc: `    installer.pods_project.targets.each do |target|
      next unless target.name.start_with?('RNFB')

      target.build_configurations.each do |config|
        config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
      end
    end`,
      anchor: /post_install do \|installer\|/,
      offset: 7,
      comment: "#",
    }).contents

    return config
  })

  return config
}
