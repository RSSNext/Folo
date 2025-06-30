import type { ConfigContext, ExpoConfig } from "expo/config"
import { resolve } from "pathe"

import PKG from "./package.json"

// const roundedIconPath = resolve(__dirname, "../../resources/icon.png")
const iconPathMap = {
  production: resolve(__dirname, "./assets/icon.png"),
  development: resolve(__dirname, "./assets/icon-dev.png"),
  "ios-simulator": resolve(__dirname, "./assets/icon-dev.png"),
  preview: resolve(__dirname, "./assets/icon-staging.png"),
} as Record<string, string>
const iconPath = iconPathMap[process.env.PROFILE || "production"] || iconPathMap.production

const adaptiveIconPath = resolve(__dirname, "./assets/adaptive-icon.png")

const isDev = process.env.NODE_ENV === "development"

export default ({ config }: ConfigContext): ExpoConfig => {
  const result: ExpoConfig = {
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
    runtimeVersion: isDev ? "0.0.0-dev" : PKG.version,

    name: "Folo",
    slug: "follow",
    version: PKG.version,
    orientation: "portrait" as const,
    icon: iconPath,
    scheme: ["follow", "folo"],
    userInterfaceStyle: "automatic" as const,
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
        CFBundleLocalizations: ["en", "ja", "zh-CN", "zh-TW"],
        CFBundleDevelopmentRegion: "en",
      },
      googleServicesFile: "./build/GoogleService-Info.plist",
    },
    android: {
      package: "is.follow",
      // Suppress warning about EDGE_TO_EDGE_PLUGIN
      // Learn more: https://expo.dev/blog/edge-to-edge-display-now-streamlined-for-android
      edgeToEdgeEnabled: true,
      adaptiveIcon: {
        foregroundImage: adaptiveIconPath,
        monochromeImage: adaptiveIconPath,
        backgroundColor: "#FF5C00",
      },
      googleServicesFile: "./build/google-services.json",
    },
    androidStatusBar: {
      translucent: true,
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
      "expo-web-browser",
      [
        "expo-video",
        {
          supportsBackgroundPlayback: true,
          supportsPictureInPicture: true,
        },
      ],
      [
        require("./plugins/with-follow-assets.js"),
        {
          // Add asset directory paths, the plugin copies the files in the given paths to the app bundle folder named Assets
          assetsPath: resolve(__dirname, "..", "..", "out", "rn-web"),
        },
      ],

      require("./plugins/with-gradle-jvm-heap-size-increase.js"),
      require("./plugins/with-android-manifest-plugin.js"),
      "expo-secure-store",
      "@react-native-firebase/app",
      "@react-native-firebase/crashlytics",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos.",
        },
      ],
      [
        "expo-notifications",
        {
          enableBackgroundRemoteNotifications: true,
        },
      ],
      "expo-background-task",
    ],
  }

  if (process.env.PROFILE !== "production") {
    result.plugins ||= []
    result.plugins.push(require("./plugins/android-trust-user-certs.js"))
  }

  return result
}
