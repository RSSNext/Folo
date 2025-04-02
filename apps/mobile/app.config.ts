import { resolve } from "node:path"

import type { ConfigContext, ExpoConfig } from "expo/config"

import PKG from "./package.json"

const isCI = process.env.CI === "true"
// const roundedIconPath = resolve(__dirname, "../../resources/icon.png")
const iconPathMap = {
  production: resolve(__dirname, "./assets/icon.png"),
  development: resolve(__dirname, "./assets/icon-dev.png"),
  "ios-simulator": resolve(__dirname, "./assets/icon-dev.png"),
  preview: resolve(__dirname, "./assets/icon-staging.png"),
} as Record<string, string>
const iconPath = iconPathMap[process.env.PROFILE || "production"] || iconPathMap.production

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
      CFBundleAllowMixedLocalizations: true,
      // apps/mobile/src/@types/constants.ts currentSupportedLanguages
      CFBundleLocalizations: [
        "en",
        "de",
        "ja",
        "zh-CN",
        "zh-TW",
        "zh-HK",
        "pt",
        "fr",
        "ar-DZ",
        "ar-SA",
        "ar-MA",
        "ar-IQ",
        "ar-KW",
        "ar-TN",
        "fi",
        "it",
        "ru",
        "es",
        "ko",
        "tr",
      ],
      CFBundleDevelopmentRegion: "en",
    },
    googleServicesFile: "./build/GoogleService-Info.plist",
  },
  android: {
    // Workaround for https://github.com/doublesymmetry/react-native-track-player/issues/2293
    newArchEnabled: false,
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
        android: {
          image: iconPath,
          imageWidth: 200,
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
