import type { ConfigContext, ExpoConfig } from "expo/config"

import PKG from "./package.json"

// const iconPath = resolve(__dirname, "./assets/icon.png")

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  owner: "follow",

  name: "Folo Native Kit Demo",
  slug: "follow-native-kit-demo",
  version: PKG.version,
  orientation: "portrait",
  // icon: iconPath,
  scheme: "follow-native-kit-demo",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: "is.follow.native-kit-demo",
  },
  android: {
    package: "is.follow.nativekitdemo",
  },
})
