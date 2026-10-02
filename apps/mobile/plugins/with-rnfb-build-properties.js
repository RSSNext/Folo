const { withPodfile, withPodfileProperties } = require("expo/config-plugins")

const { mergeContents } = require("./merge-contents")

const STATIC_FRAMEWORK_TAG = "follow-rnfb-static-framework"
const RNFB_IOS_COMPAT_TAG = "follow-rnfb-ios-compat"
const RNFB_STATIC_PODS = ["RNFBApp", "RNFBAnalytics", "RNFBMessaging", "RNFBAppCheck"]

// Finds the `end` that closes `post_install do |installer|`: the next line at the same indentation.
// Anchoring there instead of a fixed line offset keeps the generated block inside the hook, after
// `react_native_post_install(...)`, however many lines the Expo template gives that call.
function findPostInstallEnd(lines) {
  const startIndex = lines.findIndex((line) => /post_install do \|installer\|/.test(line))
  if (startIndex === -1) {
    return -1
  }

  const indent = lines[startIndex].match(/^\s*/)[0]
  return lines.findIndex((line, index) => index > startIndex && line.trimEnd() === `${indent}end`)
}

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
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end

      next unless target.name == 'fmt'

      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++17'
        definitions = config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] || ['$(inherited)']
        definitions = [definitions] unless definitions.is_a?(Array)
        definitions << 'FMT_USE_CONSTEVAL=0' unless definitions.include?('FMT_USE_CONSTEVAL=0')
        config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] = definitions
      end
    end

    # Xcode 27 refuses deployment targets below iOS 15, and its Swift compiler rejects iOS 16
    # APIs in pods that still declare an older floor (react-native-ios-context-menu, for one).
    # The app itself requires ios.deploymentTarget, so every pod target is raised to at least that.
    deployment_target = (podfile_properties['ios.deploymentTarget'] || '16.4').to_f
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        current_target = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f
        if current_target < deployment_target
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = deployment_target.to_s
        end
      end
    end`,
      anchor: findPostInstallEnd,
      // Insert right before the closing `end`, so the block runs last in `post_install`.
      offset: -1,
      comment: "#",
    }).contents

    return config
  })

  return config
}
