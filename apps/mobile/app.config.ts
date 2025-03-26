import { resolve } from "node:path"

import type { ConfigContext, ExpoConfig } from "expo/config"

import PKG from "./package.json"

// const isDev = process.env.NODE_ENV === "development"
const isCI = process.env.CI === "true"
// const roundedIconPath = resolve(__dirname, "../../resources/icon.png")
const iconPath = resolve(__dirname, "./assets/icon.png")
const adaptiveIconPath = resolve(__dirname, "./assets/adaptive-icon.png")
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,

  extra: {
    eas: {
      projectId: "a6335b14-fb84-45aa-ba80-6f6ab8926920",
    },
  },
  owner: "follow",
  updates: {
    url: "https://u.expo.dev/a6335b14-fb84-45aa-ba80-6f6ab8926920",
  },
  runtimeVersion: {
    policy: "appVersion",
  },

  name: "Folo",
  slug: "follow",
  version: PKG.version,
  orientation: "portrait",
  icon: iconPath,
  scheme: "follow",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "is.follow",
    usesAppleSignIn: true,
    infoPlist: {
      LSApplicationCategoryType: "public.app-category.news",
      ITSAppUsesNonExemptEncryption: false,
      UIBackgroundModes: ["audio"],
      LSApplicationQueriesSchemes: ["bilibili", "youtube"],
    },
    googleServicesFile: "./build/GoogleService-Info.plist",
  },
  android: {
    package: "is.follow",
    adaptiveIcon: {
      foregroundImage: adaptiveIconPath,
      backgroundColor: "#FF5C00",
    },
    googleServicesFile: "./build/google-services.json",
  },
  // web: {
  //   bundler: "metro",
  //   output: "static",
  //   favicon: iconPath,
  // },
  plugins: [
    [
      "expo-document-picker",
      {
        iCloudContainerEnvironment: "Production",
      },
    ],
    "expo-localization",

    [
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static",
        },
      },
    ],
    "expo-sqlite",
    [
      "expo-media-library",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        savePhotosPermission: "Allow $(PRODUCT_NAME) to save photos.",
        isAccessMediaLocationEnabled: true,
      },
    ],
    "expo-apple-authentication",
    "expo-av",
    [
      require("./scripts/with-follow-assets.js"),
      {
        // Add asset directory paths, the plugin copies the files in the given paths to the app bundle folder named Assets
        assetsPath: !isCI ? resolve(__dirname, "..", "..", "out", "rn-web") : "/tmp/rn-web",
      },
    ],
    [require("./scripts/with-follow-app-delegate.js")],
    "expo-secure-store",
    "@react-native-firebase/app",
    "@react-native-firebase/crashlytics",
    "@react-native-firebase/app-check",
    [
      "expo-image-picker",
      {
        photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
      },
    ],
    "react-native-video",
  ],
  experiments: {
    typedRoutes: true,
  },
})
